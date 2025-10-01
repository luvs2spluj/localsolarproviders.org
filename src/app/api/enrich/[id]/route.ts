import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { enrichInstallerWebsite } from '@/lib/enrich'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: installerId } = await params
    
    // Get installer from database
    const installer = await prisma.installer.findUnique({
      where: { id: installerId }
    })
    
    if (!installer) {
      return NextResponse.json(
        { error: 'Installer not found' },
        { status: 404 }
      )
    }
    
    if (!installer.website) {
      return NextResponse.json(
        { error: 'No website URL available for this installer' },
        { status: 400 }
      )
    }
    
    console.log(`Enriching installer: ${installer.name} - ${installer.website}`)
    
    // Log enrichment attempt
    await prisma.scanLog.create({
      data: {
        installerId: installer.id,
        source: 'SITE',
        status: 'OK',
        message: `Website enrichment started for ${installer.website}`
      }
    })
    
    // Enrich the installer's website
    const enrichmentResult = await enrichInstallerWebsite(installer.website)
    
    if (!enrichmentResult.success) {
      // Log the error
      await prisma.scanLog.create({
        data: {
          installerId: installer.id,
          source: 'SITE',
          status: 'ERROR',
          message: `Enrichment failed: ${enrichmentResult.error}`
        }
      })
      
      return NextResponse.json({
        success: false,
        error: enrichmentResult.error,
        installer: installer
      })
    }
    
    // Get all specialties from database
    const allSpecialties = await prisma.specialty.findMany()
    const specialtyMap = new Map(allSpecialties.map(s => [s.slug, s.id]))
    
    // Remove existing specialties for this installer
    await prisma.installerSpecialty.deleteMany({
      where: { installerId: installer.id }
    })
    
    // Add detected specialties
    const specialtyData = enrichmentResult.specialties
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
    
    // Update installer's last scanned time
    const updatedInstaller = await prisma.installer.update({
      where: { id: installer.id },
      data: { lastScannedAt: new Date() },
      include: {
        specialties: {
          include: {
            specialty: true
          }
        },
        externalLinks: true
      }
    })
    
    // Log successful enrichment
    await prisma.scanLog.create({
      data: {
        installerId: installer.id,
        source: 'SITE',
        status: 'OK',
        message: `Enrichment completed. Found ${enrichmentResult.specialties.length} specialties: ${enrichmentResult.specialties.join(', ')}`
      }
    })
    
    return NextResponse.json({
      success: true,
      installer: updatedInstaller,
      enrichment: {
        specialtiesFound: enrichmentResult.specialties.length,
        specialties: enrichmentResult.specialties,
        scannedAt: enrichmentResult.scannedAt
      }
    })
    
  } catch (error) {
    console.error('Enrichment error:', error)
    
    // Log the error
    try {
      const { id: installerId } = await params
      await prisma.scanLog.create({
        data: {
          installerId,
          source: 'SITE',
          status: 'ERROR',
          message: `Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return NextResponse.json(
      { error: 'Failed to enrich installer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
