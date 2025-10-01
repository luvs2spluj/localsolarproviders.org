// Brave Search API provider
// Free tier with explicit rights to store data
// https://brave.com/search/api/

export interface NormalizedResult {
  title: string
  url: string
  snippet: string
  rank: number
  engine: 'BRAVE' | 'GOOGLE'
}

interface BraveWebResult {
  title: string
  url: string
  description: string
  page_age?: string
  page_fetched?: string
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[]
  }
  query?: {
    original: string
    show_strict_warning: boolean
  }
}

export async function searchBrave(query: string): Promise<NormalizedResult[]> {
  const apiKey = process.env.BRAVE_API_KEY
  
  if (!apiKey) {
    throw new Error('BRAVE_API_KEY is not configured')
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '20')
  url.searchParams.set('search_lang', 'en')
  url.searchParams.set('country', 'US')
  url.searchParams.set('safesearch', 'moderate')
  url.searchParams.set('freshness', 'pw') // past week for more current results

  try {
    console.log(`Brave Search: ${query}`)
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'SolarProvidersApp/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Brave API rate limit exceeded. Please try again later.')
      }
      if (response.status === 401) {
        throw new Error('Invalid Brave API key')
      }
      if (response.status >= 500) {
        throw new Error('Brave API service temporarily unavailable')
      }
      throw new Error(`Brave API error: ${response.status} ${response.statusText}`)
    }

    const data: BraveSearchResponse = await response.json()
    
    if (!data.web?.results) {
      console.warn('No web results from Brave API')
      return []
    }

    return data.web.results.map((result, index): NormalizedResult => ({
      title: result.title || 'No title',
      url: result.url,
      snippet: result.description || 'No description available',
      rank: index + 1,
      engine: 'BRAVE'
    }))

  } catch (error) {
    if (error instanceof Error) {
      console.error('Brave Search error:', error.message)
      throw error
    }
    throw new Error('Unknown error occurred during Brave search')
  }
}

// Rate limiting helper
let lastBraveCall = 0
const BRAVE_RATE_LIMIT_MS = 1000 // 1 request per second for free tier

export async function searchBraveWithRateLimit(query: string): Promise<NormalizedResult[]> {
  const now = Date.now()
  const timeSinceLastCall = now - lastBraveCall
  
  if (timeSinceLastCall < BRAVE_RATE_LIMIT_MS) {
    const waitTime = BRAVE_RATE_LIMIT_MS - timeSinceLastCall
    console.log(`Rate limiting: waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastBraveCall = Date.now()
  return searchBrave(query)
}

// Exponential backoff retry helper
export async function searchBraveWithRetry(
  query: string, 
  maxRetries = 3
): Promise<NormalizedResult[]> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await searchBraveWithRateLimit(query)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on authentication or quota errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid') || error.message.includes('rate limit')) {
          throw error
        }
      }
      
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        console.log(`Brave search attempt ${attempt + 1} failed, retrying in ${backoffMs}ms`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}
