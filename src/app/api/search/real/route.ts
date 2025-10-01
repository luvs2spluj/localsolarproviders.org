import { NextRequest, NextResponse } from 'next/server'
import { searchProvidersWithChatGPT } from '@/lib/chatgpt-search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || searchParams.get('address')
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    console.log(`Real search for: ${location}`)
    
    // For now, use the ChatGPT search as a fallback until real APIs are configured
    const searchResult = await searchProvidersWithChatGPT(location)
    
    // Return the search result directly since chatGPTSearchForProviders already returns the right format
    return NextResponse.json({
      providers: searchResult.providers,
      location: searchResult.location,
      metadata: {
        source: 'chatgpt-fallback',
        query: location,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Real search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search for providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}