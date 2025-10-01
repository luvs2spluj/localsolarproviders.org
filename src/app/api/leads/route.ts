import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, solarLeads, solarProviders } from '@/db'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = []
    
    if (providerId) {
      conditions.push(eq(solarLeads.providerId, providerId))
    }
    
    if (status) {
      conditions.push(eq(solarLeads.status, status))
    }

    const leads = await db
      .select()
      .from(solarLeads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(solarLeads.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      leads,
      pagination: {
        limit,
        offset,
        hasMore: leads.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['providerId', 'firstName', 'lastName', 'email']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if provider exists
    const [provider] = await db
      .select()
      .from(solarProviders)
      .where(eq(solarProviders.id, body.providerId))

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Insert new lead
    const [newLead] = await db
      .insert(solarLeads)
      .values({
        providerId: body.providerId,
        userId: userId || null,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        projectType: body.projectType,
        estimatedSystemSize: body.estimatedSystemSize,
        monthlyElectricBill: body.monthlyElectricBill,
        timeframe: body.timeframe,
        message: body.message,
        source: 'solarreviews'
      })
      .returning()

    // Update provider's lead count
    await db
      .update(solarProviders)
      .set({
        totalLeads: provider.totalLeads ? provider.totalLeads + 1 : 1,
        updatedAt: new Date()
      })
      .where(eq(solarProviders.id, body.providerId))

    return NextResponse.json({
      message: 'Lead submitted successfully',
      leadId: newLead.id
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
