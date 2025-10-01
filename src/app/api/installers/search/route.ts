// Solar Installer Search API
// Provides search functionality for solar installers with various filters

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { solarProviders } from '@/db/schema'
import { eq, and, or, ilike, gte, lte, desc, asc } from 'drizzle-orm'
import { searchSolarProvidersSemantic } from '@/lib/embeddings'

export interface SearchFilters {
  state?: string
  city?: string
  specialty?: string
  minRating?: number
  maxDistance?: number
  lat?: number
  lng?: number
  limit?: number
  offset?: number
  sortBy?: 'rating' | 'reviews' | 'distance' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  id: string
  name: string
  businessName?: string
  location: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
  email?: string
  website?: string
  licenseNumber?: string
  licenseState?: string
  licenseType?: string
  specialties: string[]
  overallRating: number
  totalReviews: number
  estimatedInstalledKw?: number
  isVerified: boolean
  distance?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const filters: SearchFilters = {
      state: searchParams.get('state') || undefined,
      city: searchParams.get('city') || undefined,
      specialty: searchParams.get('specialty') || undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      maxDistance: searchParams.get('maxDistance') ? parseInt(searchParams.get('maxDistance')!) : undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: (searchParams.get('sortBy') as any) || 'rating',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    // Build query conditions
    const conditions = []
    
    if (filters.state) {
      conditions.push(eq(solarProviders.state, filters.state))
    }
    
    if (filters.city) {
      conditions.push(ilike(solarProviders.city, `%${filters.city}%`))
    }
    
    if (filters.specialty) {
      conditions.push(ilike(solarProviders.specialties, `%${filters.specialty}%`))
    }
    
    if (filters.minRating) {
      conditions.push(gte(solarProviders.overallRating, filters.minRating.toString()))
    }

    // Execute query
    let query = db.select().from(solarProviders)
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Add sorting
    switch (filters.sortBy) {
      case 'rating':
        query = query.orderBy(filters.sortOrder === 'asc' ? asc(solarProviders.overallRating) : desc(solarProviders.overallRating))
        break
      case 'reviews':
        query = query.orderBy(filters.sortOrder === 'asc' ? asc(solarProviders.totalReviews) : desc(solarProviders.totalReviews))
        break
      case 'name':
        query = query.orderBy(filters.sortOrder === 'asc' ? asc(solarProviders.name) : desc(solarProviders.name))
        break
      default:
        query = query.orderBy(desc(solarProviders.overallRating))
    }

    // Add pagination
    query = query.limit(filters.limit!).offset(filters.offset!)

    const providers = await query

    // Transform results
    const results: SearchResult[] = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      businessName: provider.businessName || undefined,
      location: provider.location,
      address: provider.address || undefined,
      city: provider.city || undefined,
      state: provider.state || undefined,
      zipCode: provider.zipCode || undefined,
      phone: provider.phone || undefined,
      email: provider.email || undefined,
      website: provider.website || undefined,
      licenseNumber: provider.licenseNumber || undefined,
      licenseState: provider.licenseState || undefined,
      licenseType: provider.licenseType || undefined,
      specialties: provider.specialties || [],
      overallRating: parseFloat(provider.overallRating || '0'),
      totalReviews: provider.totalReviews || 0,
      estimatedInstalledKw: provider.estimatedInstalledKw ? parseFloat(provider.estimatedInstalledKw) : undefined,
      isVerified: provider.isVerified || false
    }))

    // Calculate distances if coordinates provided
    if (filters.lat && filters.lng && filters.maxDistance) {
      const resultsWithDistance = results.map(result => {
        // This would calculate actual distance using Haversine formula
        // For now, return a mock distance
        const distance = Math.random() * filters.maxDistance!
        return {
          ...result,
          distance: Math.round(distance * 100) / 100
        }
      }).filter(result => result.distance! <= filters.maxDistance!)

      return NextResponse.json({
        success: true,
        data: resultsWithDistance,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: resultsWithDistance.length
        },
        filters
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: results.length
      },
      filters
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Semantic search endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, contentType = 'profile', limit = 10 } = body

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Perform semantic search
    const semanticResults = await searchSolarProvidersSemantic(
      query,
      contentType,
      limit,
      apiKey
    )

    // Get full provider data for each result
    const results = await Promise.all(
      semanticResults.map(async (result) => {
        const provider = await db.select().from(solarProviders).where(eq(solarProviders.id, result.providerId)).limit(1)
        return {
          ...provider[0],
          similarity: result.similarity,
          matchedContent: result.content
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: results,
      query,
      contentType,
      total: results.length
    })

  } catch (error) {
    console.error('Semantic search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
