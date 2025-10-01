import { NextRequest, NextResponse } from 'next/server'
import { sampleProviders, sampleReviews } from '@/lib/seed-data'
// import { db, solarProviders, solarReviews } from '@/db'
// import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params

    // Get provider details from sample data
    const provider = sampleProviders.find(p => p.id === providerId && p.isActive)

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Get reviews for this provider from sample data
    const reviews = sampleReviews
      .filter(review => review.providerId === providerId && review.isPublished)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json({
      provider,
      reviews,
      reviewCount: provider.totalReviews
    })
  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params
    const body = await request.json()

    // Update provider
    const [updatedProvider] = await db
      .update(solarProviders)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(solarProviders.id, providerId))
      .returning()

    if (!updatedProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Provider updated successfully',
      provider: updatedProvider
    })
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}
