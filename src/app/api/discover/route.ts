import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { discoverSolarInstallers, geocodeAddress } from '@/lib/overpass'
import { generateAllLinks } from '@/lib/reviewLinks'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lon, radiusMeters, location } = body
    
    let searchLat = lat
    let searchLon = lon
    
    // If location string provided, geocode it first
    if (location && (!lat || !lon)) {
      const coords = await geocodeAddress(location)
      if (!coords) {
        return NextResponse.json(
          { error: 'Could not geocode the provided location' },
          { status: 400 }
        )
      }
      searchLat = coords.lat
      searchLon = coords.lon
    }
    
    if (!searchLat || !searchLon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }
    
    const radius = radiusMeters || 25000 // Default 25km
    
    // Validate radius
    if (radius > 50000) {
      return NextResponse.json(
        { error: 'Radius too large. Maximum 50km allowed.' },
        { status: 400 }
      )
    }
    
    console.log(`Discovering installers near ${searchLat}, ${searchLon} within ${radius}m`)
    
    // Log the discovery attempt
    await prisma.scanLog.create({
      data: {
        source: 'OVERPASS',
        status: 'OK',
        message: `Discovery started for ${searchLat}, ${searchLon} radius ${radius}m`
      }
    })
    
    // Discover installers from OpenStreetMap
    const candidates = await discoverSolarInstallers(searchLat, searchLon, radius)
    
    console.log(`Found ${candidates.length} candidates`)
    
    // Upsert candidates into database
    const installers = []
    
    for (const candidate of candidates) {
      try {
        // Check if installer already exists by OSM ID or name+location
        const existing = await prisma.installer.findFirst({
          where: {
            OR: [
              { osmId: candidate.osmId },
              {
                AND: [
                  { name: { equals: candidate.name, mode: 'insensitive' } },
                  { lat: { gte: candidate.lat - 0.001, lte: candidate.lat + 0.001 } },
                  { lon: { gte: candidate.lon - 0.001, lte: candidate.lon + 0.001 } }
                ]
              }
            ]
          }
        })
        
        let installer
        if (existing) {
          // Update existing installer
          installer = await prisma.installer.update({
            where: { id: existing.id },
            data: {
              name: candidate.name,
              lat: candidate.lat,
              lon: candidate.lon,
              address: candidate.address,
              city: candidate.city,
              state: candidate.state,
              postal: candidate.postal,
              phone: candidate.phone,
              website: candidate.website,
              lastScannedAt: new Date()
            }
          })
        } else {
          // Create new installer
          installer = await prisma.installer.create({
            data: {
              osmId: candidate.osmId,
              name: candidate.name,
              lat: candidate.lat,
              lon: candidate.lon,
              address: candidate.address,
              city: candidate.city,
              state: candidate.state,
              postal: candidate.postal,
              phone: candidate.phone,
              website: candidate.website,
              lastScannedAt: new Date()
            }
          })
          
          // Generate external links for new installer
          const allLinks = generateAllLinks({
            name: installer.name,
            city: installer.city || undefined,
            state: installer.state || undefined,
            phone: installer.phone || undefined,
            website: installer.website || undefined
          })
          
          // Save all links to database
          const linkData = [
            ...allLinks.reviews,
            ...allLinks.licensing,
            ...allLinks.industry
          ].map(link => ({
            installerId: installer.id,
            kind: link.kind,
            url: link.url
          }))
          
          if (linkData.length > 0) {
            await prisma.externalLink.createMany({
              data: linkData,
              skipDuplicates: true
            })
          }
        }
        
        installers.push(installer)
        
        // Log successful processing
        await prisma.scanLog.create({
          data: {
            installerId: installer.id,
            source: 'OVERPASS',
            status: 'OK',
            message: `Processed installer: ${installer.name}`
          }
        })
        
      } catch (error) {
        console.error(`Error processing candidate ${candidate.name}:`, error)
        
        // Log error
        await prisma.scanLog.create({
          data: {
            source: 'OVERPASS',
            status: 'ERROR',
            message: `Error processing ${candidate.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        })
      }
    }
    
    // Return results with external links
    const installersWithLinks = await Promise.all(
      installers.map(async (installer) => {
        const externalLinks = await prisma.externalLink.findMany({
          where: { installerId: installer.id }
        })
        
        return {
          ...installer,
          externalLinks
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      discovered: candidates.length,
      processed: installers.length,
      searchParams: {
        lat: searchLat,
        lon: searchLon,
        radius
      },
      installers: installersWithLinks
    })
    
  } catch (error) {
    console.error('Discovery error:', error)
    
    // Log the error
    try {
      await prisma.scanLog.create({
        data: {
          source: 'OVERPASS',
          status: 'ERROR',
          message: `Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return NextResponse.json(
      { error: 'Failed to discover installers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
