// Google Programmable Search Engine (Custom Search JSON API)
// Free: 100 queries/day, then $5 per 1,000 queries
// Docs: https://developers.google.com/custom-search/v1/introduction
// Pricing: https://developers.google.com/custom-search/v1/overview#pricing
// 
// IMPORTANT: Review Google's branding and usage requirements:
// - Must display "Powered by Google" attribution
// - Cannot modify or remove Google branding from results
// - Results must be displayed in a way that doesn't mislead users about the source
// - See: https://developers.google.com/custom-search/docs/ui

import { NormalizedResult } from './brave'

interface GoogleSearchItem {
  title: string
  link: string
  snippet: string
  displayLink?: string
  formattedUrl?: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
  queries?: {
    request: Array<{
      title: string
      totalResults: string
      searchTerms: string
      count: number
      startIndex: number
    }>
  }
  error?: {
    code: number
    message: string
    errors: Array<{
      domain: string
      reason: string
      message: string
    }>
  }
}

export async function searchGoogleCSE(
  query: string, 
  cx: string, 
  apiKey: string
): Promise<NormalizedResult[]> {
  
  if (!cx || !apiKey) {
    throw new Error('Google CSE requires both GOOGLE_CSE_CX and GOOGLE_CSE_API_KEY')
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cx)
  url.searchParams.set('q', query)
  url.searchParams.set('num', '10') // Max 10 results per request
  url.searchParams.set('safe', 'active')
  url.searchParams.set('fields', 'items(title,link,snippet,displayLink),searchInformation(totalResults,searchTime),error')

  try {
    console.log(`Google CSE Search: ${query}`)
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SolarProvidersApp/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Google CSE daily quota exceeded (100 free queries/day)')
      }
      if (response.status === 403) {
        throw new Error('Google CSE API key invalid or quota exceeded')
      }
      if (response.status >= 500) {
        throw new Error('Google CSE service temporarily unavailable')
      }
      throw new Error(`Google CSE API error: ${response.status} ${response.statusText}`)
    }

    const data: GoogleSearchResponse = await response.json()
    
    // Handle API-level errors
    if (data.error) {
      const errorMsg = data.error.message || 'Unknown Google CSE error'
      console.error('Google CSE API error:', data.error)
      throw new Error(`Google CSE: ${errorMsg}`)
    }
    
    if (!data.items || data.items.length === 0) {
      console.warn('No results from Google CSE')
      return []
    }

    return data.items.map((item, index): NormalizedResult => ({
      title: item.title || 'No title',
      url: item.link,
      snippet: item.snippet || 'No description available',
      rank: index + 1,
      engine: 'GOOGLE'
    }))

  } catch (error) {
    if (error instanceof Error) {
      console.error('Google CSE error:', error.message)
      throw error
    }
    throw new Error('Unknown error occurred during Google CSE search')
  }
}

// Rate limiting for Google CSE (be conservative with free quota)
let lastGoogleCall = 0
const GOOGLE_RATE_LIMIT_MS = 2000 // 2 seconds between requests to preserve quota

export async function searchGoogleCSEWithRateLimit(
  query: string, 
  cx: string, 
  apiKey: string
): Promise<NormalizedResult[]> {
  const now = Date.now()
  const timeSinceLastCall = now - lastGoogleCall
  
  if (timeSinceLastCall < GOOGLE_RATE_LIMIT_MS) {
    const waitTime = GOOGLE_RATE_LIMIT_MS - timeSinceLastCall
    console.log(`Google CSE rate limiting: waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastGoogleCall = Date.now()
  return searchGoogleCSE(query, cx, apiKey)
}

// Retry with exponential backoff
export async function searchGoogleCSEWithRetry(
  query: string,
  cx: string,
  apiKey: string,
  maxRetries = 2 // Conservative for quota preservation
): Promise<NormalizedResult[]> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await searchGoogleCSEWithRateLimit(query, cx, apiKey)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on quota/auth errors
      if (error instanceof Error) {
        if (error.message.includes('quota') || 
            error.message.includes('invalid') || 
            error.message.includes('403')) {
          throw error
        }
      }
      
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 2000 // 2s, 4s
        console.log(`Google CSE attempt ${attempt + 1} failed, retrying in ${backoffMs}ms`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

// Helper to check if Google CSE is properly configured
export function isGoogleCSEConfigured(): boolean {
  return !!(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX)
}

// Attribution helper for UI compliance
export function getGoogleAttribution(): {
  text: string
  required: boolean
  link: string
} {
  return {
    text: 'Powered by Google',
    required: true,
    link: 'https://developers.google.com/custom-search'
  }
}
