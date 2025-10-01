import { NextRequest, NextResponse } from 'next/server'
import { searchProvidersWithChatGPT } from '@/lib/chatgpt-search'

interface SearchRequest {
  location: string
  engine?: 'BRAVE' | 'GOOGLE'
  force?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { location } = body
    
    if (!location?.trim()) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log(`Search request: solar installers in ${location}`)

    // Use ChatGPT search for now - this provides reliable mock data
    const searchResult = await searchProvidersWithChatGPT(location.trim())
    
    // Transform to expected search result format
    const results = searchResult.providers.map((provider, index) => ({
      id: `search-${Date.now()}-${index}`,
      engine: 'MOCK' as const,
      query: `solar installers in ${location}`,
      location: location.trim(),
      title: provider.name,
      url: provider.website || `https://example.com/${provider.name.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: provider.description || `Professional solar installation services in ${provider.location}`,
      sourceRank: index + 1,
      fetchedAt: new Date().toISOString(),
      hash: `mock-${Date.now()}-${index}`
    }))

    return NextResponse.json({
      results,
      metadata: {
        engine: 'MOCK',
        query: `solar installers in ${location}`,
        location: location.trim(),
        total: results.length,
        cached: false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET requests for compatibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || searchParams.get('q')
    
    if (!location?.trim()) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    // Use the same logic as POST
    const searchResult = await searchProvidersWithChatGPT(location.trim())
    
    const results = searchResult.providers.map((provider, index) => ({
      id: `search-${Date.now()}-${index}`,
      engine: 'MOCK' as const,
      query: `solar installers in ${location}`,
      location: location.trim(),
      title: provider.name,
      url: provider.website || `https://example.com/${provider.name.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: provider.description || `Professional solar installation services in ${provider.location}`,
      sourceRank: index + 1,
      fetchedAt: new Date().toISOString(),
      hash: `mock-${Date.now()}-${index}`
    }))

    return NextResponse.json({
      results,
      metadata: {
        engine: 'MOCK',
        query: `solar installers in ${location}`,
        location: location.trim(),
        total: results.length,
        cached: false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}