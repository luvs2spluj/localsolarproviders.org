import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateDistance } from '@/lib/geocoding'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const specialty = searchParams.get('specialty')
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : null
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50 // miles
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (location) {
      where.OR = [
        { name: { contains: location, mode: 'insensitive' } },
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } }
      ]
    }

    // Get installers with specialties and external links
    const installers = await prisma.installer.findMany({
      where,
      include: {
        specialties: {
          include: {
            specialty: true
          }
        },
        externalLinks: true
      },
      skip: offset,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })

    // Filter by specialty if specified
    let filteredInstallers = installers
    if (specialty) {
      filteredInstallers = installers.filter(installer =>
        installer.specialties.some(s => s.specialty.slug === specialty)
      )
    }

    // Calculate distances if user location provided
    const installersWithDistance = filteredInstallers.map(installer => {
      let distance = null
      if (lat !== null && lon !== null) {
        distance = calculateDistance(lat, lon, installer.lat, installer.lon)
      }

      return {
        id: installer.id,
        name: installer.name,
        businessName: installer.name, // Use name as business name
        location: [installer.city, installer.state].filter(Boolean).join(', ') || 'Location not specified',
        address: installer.address,
        city: installer.city,
        state: installer.state,
        zipCode: installer.postal,
        phone: installer.phone,
        website: installer.website,
        overallRating: '0', // No ratings yet - would come from reviews
        totalReviews: 0,
        totalLeads: 0,
        specialties: installer.specialties.map(s => s.specialty.label),
        isVerified: false, // Would be determined by verification process
        isActive: true,
        distance: distance ? Math.round(distance * 10) / 10 : null,
        coordinates: { lat: installer.lat, lon: installer.lon },
        source: 'database',
        lastScannedAt: installer.lastScannedAt,
        externalLinks: installer.externalLinks
      }
    })

    // Filter by distance if user location and radius provided
    const finalInstallers = lat !== null && lon !== null && radius
      ? installersWithDistance.filter(installer => 
          installer.distance === null || installer.distance <= radius
        )
      : installersWithDistance

    // Sort by distance if available, otherwise by update time
    finalInstallers.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance
      }
      return new Date(b.lastScannedAt || 0).getTime() - new Date(a.lastScannedAt || 0).getTime()
    })

    return NextResponse.json({
      providers: finalInstallers,
      pagination: {
        limit,
        offset,
        hasMore: finalInstallers.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'location', 'email']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // For now, just return success (would save to database in production)
    const newProvider = {
      id: `provider_${Date.now()}`,
      name: body.name,
      businessName: body.businessName,
      location: body.location,
      ...body,
      overallRating: '0',
      totalReviews: 0,
      totalLeads: 0,
      isVerified: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Provider added successfully',
      provider: newProvider
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating provider:', error)
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    )
  }
}
