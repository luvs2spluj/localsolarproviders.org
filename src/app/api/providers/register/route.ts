import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { geocodeAddress } from '@/lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessName,
      contactName,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      specialties,
      description,
      licenseNumber,
      yearsInBusiness
    } = body

    // Validate required fields
    if (!businessName || !contactName || !email || !phone || !address || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, contactName, email, phone, address, city, state' },
        { status: 400 }
      )
    }

    // Geocode the address to get coordinates
    let coordinates = { lat: 0, lon: 0 }
    try {
      const geocodeResults = await geocodeAddress(`${address}, ${city}, ${state}`)
      if (geocodeResults.length > 0) {
        coordinates = {
          lat: geocodeResults[0].lat,
          lon: geocodeResults[0].lon
        }
      }
    } catch (error) {
      console.warn('Geocoding failed for provider registration:', error)
    }

    // Create the installer record
    const installer = await db.installer.create({
      data: {
        name: businessName,
        lat: coordinates.lat,
        lon: coordinates.lon,
        address: address,
        city: city,
        state: state,
        postal: zipCode,
        phone: phone,
        website: website,
        lastScannedAt: new Date()
      }
    })

    // Add specialties if provided
    if (specialties && specialties.length > 0) {
      for (const specialtySlug of specialties) {
        // Find or create specialty
        let specialty = await db.specialty.findUnique({
          where: { slug: specialtySlug }
        })

        if (!specialty) {
          specialty = await db.specialty.create({
            data: {
              slug: specialtySlug,
              label: specialtySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          })
        }

        // Link installer to specialty
        await db.installerSpecialty.create({
          data: {
            installerId: installer.id,
            specialtyId: specialty.id
          }
        })
      }
    }

    // Add external links if provided
    if (website) {
      await db.externalLink.create({
        data: {
          installerId: installer.id,
          kind: 'OTHER',
          url: website
        }
      })
    }

    return NextResponse.json({
      success: true,
      installer: {
        id: installer.id,
        name: installer.name,
        location: `${installer.city}, ${installer.state}`,
        coordinates: coordinates
      },
      message: 'Provider registered successfully! Your listing will be reviewed and published within 24 hours.'
    })

  } catch (error) {
    console.error('Provider registration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to register provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all registered providers
    const providers = await db.installer.findMany({
      include: {
        specialties: {
          include: {
            specialty: true
          }
        },
        externalLinks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      location: `${provider.city}, ${provider.state}`,
      address: provider.address,
      phone: provider.phone,
      website: provider.website,
      specialties: provider.specialties.map(s => s.specialty.label),
      externalLinks: provider.externalLinks,
      registeredAt: provider.createdAt,
      lastUpdated: provider.updatedAt
    }))

    return NextResponse.json({
      providers: formattedProviders,
      total: formattedProviders.length
    })

  } catch (error) {
    console.error('Get providers error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
