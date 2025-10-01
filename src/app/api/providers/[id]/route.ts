import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await supabaseService.getSolarProvider(params.id)

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Get reviews for this provider
    const reviews = await supabaseService.getSolarReviews(params.id)

    return NextResponse.json({
      provider,
      reviews,
      totalReviews: reviews.length
    })

  } catch (error) {
    console.error('Get provider error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const provider = await supabaseService.upsertSolarProvider({
      id: params.id,
      ...body
    })

    return NextResponse.json({
      provider,
      message: 'Provider updated successfully'
    })

  } catch (error) {
    console.error('Update provider error:', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseService.client
      .from('solarreviews_providers')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw new Error(`Failed to delete provider: ${error.message}`)
    }

    return NextResponse.json({
      message: 'Provider deleted successfully'
    })

  } catch (error) {
    console.error('Delete provider error:', error)
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    )
  }
}