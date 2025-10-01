import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const isVerified = searchParams.get('isVerified')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const filters: any = {}
    
    if (state) filters.state = state
    if (city) filters.city = city
    if (isVerified !== null) filters.isVerified = isVerified === 'true'
    if (isActive !== null) filters.isActive = isActive === 'true'
    
    filters.limit = limit
    filters.offset = offset

    const providers = await supabaseService.getSolarProviders(filters)

    return NextResponse.json({
      providers,
      total: providers.length,
      filters
    })

  } catch (error) {
    console.error('Get providers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const provider = await supabaseService.upsertSolarProvider(body)

    return NextResponse.json({
      provider,
      message: 'Provider created/updated successfully'
    })

  } catch (error) {
    console.error('Create/update provider error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update provider' },
      { status: 500 }
    )
  }
}