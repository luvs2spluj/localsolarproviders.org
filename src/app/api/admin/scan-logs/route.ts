import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const source = searchParams.get('source')
    const status = searchParams.get('status')

    const where: any = {}
    if (source) where.source = source
    if (status) where.status = status

    const logs = await prisma.scanLog.findMany({
      where,
      include: {
        installer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      logs
    })
  } catch (error) {
    console.error('Error fetching scan logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scan logs' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
