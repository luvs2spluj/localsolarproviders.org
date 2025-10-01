import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, solarReviews, solarProviders } from '@/db'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .select()
      .from(solarReviews)
      .where(eq(solarReviews.isPublished, true))
      .orderBy(desc(solarReviews.createdAt))
      .limit(limit)
      .offset(offset)

    if (providerId) {
      query = query.where(and(
        eq(solarReviews.providerId, providerId),
        eq(solarReviews.isPublished, true)
      ))
    }

    const reviews = await query

    return NextResponse.json({
      reviews,
      pagination: {
        limit,
        offset,
        hasMore: reviews.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['providerId', 'rating', 'content']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
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

    // Insert new review
    const [newReview] = await db
      .insert(solarReviews)
      .values({
        providerId: body.providerId,
        userId: userId,
        rating: body.rating,
        title: body.title,
        content: body.content,
        projectType: body.projectType,
        systemSize: body.systemSize,
        totalCost: body.totalCost,
        costPerWatt: body.costPerWatt,
        installationDate: body.installationDate ? new Date(body.installationDate) : null,
        communicationRating: body.communicationRating,
        timelinessRating: body.timelinessRating,
        qualityRating: body.qualityRating,
        valueRating: body.valueRating,
      })
      .returning()

    // Update provider's review stats (this would ideally be done with a trigger in production)
    const allReviews = await db
      .select()
      .from(solarReviews)
      .where(and(
        eq(solarReviews.providerId, body.providerId),
        eq(solarReviews.isPublished, true)
      ))

    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
    
    await db
      .update(solarProviders)
      .set({
        overallRating: avgRating.toString(),
        totalReviews: allReviews.length,
        updatedAt: new Date()
      })
      .where(eq(solarProviders.id, body.providerId))

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: newReview
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
