import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateAllLinks } from '@/lib/reviewLinks'

const prisma = new PrismaClient()

const SAMPLE_INSTALLERS = [
  {
    name: 'Bay Area Solar Solutions',
    lat: 37.7749,
    lon: -122.4194,
    address: '123 Solar St',
    city: 'San Francisco',
    state: 'CA',
    postal: '94102',
    phone: '(415) 555-0123',
    website: 'https://bayareasolar.com',
    specialties: ['residential_pv', 'battery_backup', 'ev_charger']
  },
  {
    name: 'Golden State Solar',
    lat: 37.4419,
    lon: -122.1430,
    address: '456 Energy Ave',
    city: 'Palo Alto',
    state: 'CA',
    postal: '94301',
    phone: '(650) 555-0456',
    website: 'https://goldenstatesolar.com',
    specialties: ['commercial_pv', 'ground_mount', 'microinverters']
  },
  {
    name: 'Sunshine Solar Co',
    lat: 34.0522,
    lon: -118.2437,
    address: '789 Renewable Rd',
    city: 'Los Angeles',
    state: 'CA',
    postal: '90001',
    phone: '(213) 555-0789',
    website: 'https://sunshinesolar.com',
    specialties: ['residential_pv', 'tile_roof', 'financing']
  },
  {
    name: 'Desert Solar Pros',
    lat: 33.4484,
    lon: -112.0740,
    address: '321 Desert Dr',
    city: 'Phoenix',
    state: 'AZ',
    postal: '85001',
    phone: '(602) 555-0321',
    website: 'https://desertsolar.com',
    specialties: ['residential_pv', 'commercial_pv', 'off_grid']
  },
  {
    name: 'Texas Solar Power',
    lat: 30.2672,
    lon: -97.7431,
    address: '654 Lone Star Ln',
    city: 'Austin',
    state: 'TX',
    postal: '73301',
    phone: '(512) 555-0654',
    website: 'https://texassolarpower.com',
    specialties: ['residential_pv', 'battery_backup', 'solar_maintenance']
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('Seeding sample installers...')
    
    // Get all specialties
    const allSpecialties = await prisma.specialty.findMany()
    const specialtyMap = new Map(allSpecialties.map(s => [s.slug, s.id]))
    
    const createdInstallers = []
    
    for (const installerData of SAMPLE_INSTALLERS) {
      // Check if installer already exists
      const existing = await prisma.installer.findFirst({
        where: {
          name: { equals: installerData.name, mode: 'insensitive' }
        }
      })
      
      if (existing) {
        console.log(`Installer ${installerData.name} already exists, skipping...`)
        continue
      }
      
      // Create installer
      const installer = await prisma.installer.create({
        data: {
          name: installerData.name,
          lat: installerData.lat,
          lon: installerData.lon,
          address: installerData.address,
          city: installerData.city,
          state: installerData.state,
          postal: installerData.postal,
          phone: installerData.phone,
          website: installerData.website,
          lastScannedAt: new Date()
        }
      })
      
      // Add specialties
      const specialtyData = installerData.specialties
        .map(slug => {
          const specialtyId = specialtyMap.get(slug)
          return specialtyId ? { installerId: installer.id, specialtyId } : null
        })
        .filter(Boolean) as { installerId: string; specialtyId: string }[]
      
      if (specialtyData.length > 0) {
        await prisma.installerSpecialty.createMany({
          data: specialtyData,
          skipDuplicates: true
        })
      }
      
      // Generate external links
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
      
      createdInstallers.push(installer)
      
      // Log success
      await prisma.scanLog.create({
        data: {
          installerId: installer.id,
          source: 'MANUAL',
          status: 'OK',
          message: `Sample installer seeded: ${installer.name}`
        }
      })
      
      console.log(`✓ Created installer: ${installer.name}`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${createdInstallers.length} sample installers`,
      installers: createdInstallers.map(i => ({ id: i.id, name: i.name }))
    })
    
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
