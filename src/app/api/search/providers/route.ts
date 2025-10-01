import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocoding'
import { searchProvidersWithChatGPT } from '@/lib/chatgpt-search'
import { db } from '@/lib/db'
import { createHash } from '@/lib/hash'

interface Provider {
  id: string
  name: string
  businessName: string
  location: string
  address?: string
  city: string
  state: string
  zipCode?: string
  phone?: string
  website?: string
  overallRating?: string
  totalReviews?: number
  specialties: string[]
  description?: string
  yearEstablished?: number
  licenseNumber?: string
  isVerified: boolean
  coordinates?: {
    lat: number
    lon: number
  }
  source: string
  cachedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const radius = parseInt(searchParams.get('radius') || '50')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    // Create cache key for this search
    const cacheKey = createHash(`providers:${address.toLowerCase().trim()}:${radius}`)
    
    // Check if we have cached results (valid for 6 hours for more fresh results)
    const cachedResult = await db.searchResult.findFirst({
      where: {
        hash: cacheKey,
        fetchedAt: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      }
    })

    if (cachedResult) {
      console.log('Returning cached results for:', address)
      return NextResponse.json({
        providers: JSON.parse(cachedResult.snippet),
        location: {
          address: cachedResult.location,
          coordinates: { lat: 0, lon: 0 }
        },
        cached: true,
        cachedAt: cachedResult.fetchedAt
      })
    }

    // Step 1: Geocode the address
    console.log('Geocoding address:', address)
    const geocodeResults = await geocodeAddress(address)
    
    if (geocodeResults.length === 0) {
      return NextResponse.json(
        { error: 'Could not find location for the provided address' },
        { status: 404 }
      )
    }

    const userLocation = geocodeResults[0]
    const { lat: userLat, lon: userLon } = userLocation

    // Step 2: Try multiple search methods
    let allProviders: Provider[] = []
    let searchSources: string[] = []

    // Method 1: ChatGPT-style search (always works)
    try {
      console.log('Trying ChatGPT search for:', address)
      const chatGPTResult = await searchProvidersWithChatGPT(address)
      if (chatGPTResult.providers && chatGPTResult.providers.length > 0) {
        const chatGPTProviders = chatGPTResult.providers.map((provider: any, index: number) => ({
          ...provider,
          id: `chatgpt-${index}-${Date.now()}`,
          source: 'chatgpt',
          cachedAt: new Date().toISOString()
        }))
        allProviders.push(...chatGPTProviders)
        searchSources.push('chatgpt')
        console.log(`Found ${chatGPTProviders.length} providers via ChatGPT`)
      }
    } catch (error) {
      console.warn('ChatGPT search failed:', error)
    }

    // Method 2: Google Custom Search (if configured)
    if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX) {
      try {
        console.log('Trying Google Custom Search for:', address)
        const googleProviders = await searchGoogleProviders(address, userLocation)
        if (googleProviders.length > 0) {
          allProviders.push(...googleProviders)
          searchSources.push('google')
          console.log(`Found ${googleProviders.length} providers via Google`)
        }
      } catch (error) {
        console.warn('Google search failed:', error)
      }
    }

    // Method 3: Overpass API (OpenStreetMap)
    try {
      console.log('Trying Overpass search for:', address)
      const overpassProviders = await searchOverpassProviders(address, userLocation)
      if (overpassProviders.length > 0) {
        allProviders.push(...overpassProviders)
        searchSources.push('overpass')
        console.log(`Found ${overpassProviders.length} providers via Overpass`)
      }
    } catch (error) {
      console.warn('Overpass search failed:', error)
    }

    // Method 4: Database providers (if any exist)
    try {
      const dbProviders = await searchDatabaseProviders(address, userLat, userLon, radius)
      if (dbProviders.length > 0) {
        allProviders.push(...dbProviders)
        searchSources.push('database')
        console.log(`Found ${dbProviders.length} providers in database`)
      }
    } catch (error) {
      console.warn('Database search failed:', error)
    }

    // Remove duplicates based on name and location
    const uniqueProviders = removeDuplicateProviders(allProviders)
    
    // Limit results
    const finalProviders = uniqueProviders.slice(0, limit)

    // Cache the results
    await cacheSearchResults(cacheKey, address, finalProviders, searchSources.join(','))
    
    console.log(`Total unique providers found: ${finalProviders.length} from sources: ${searchSources.join(', ')}`)

    return NextResponse.json({
      providers: finalProviders,
      location: {
        address: userLocation.display_name,
        coordinates: { lat: userLat, lon: userLon }
      },
      cached: false,
      source: searchSources.join(','),
      totalFound: finalProviders.length
    })

  } catch (error) {
    console.error('Search providers error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search for providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function searchGoogleProviders(address: string, userLocation: any): Promise<Provider[]> {
  const googleQuery = `"${address}" solar providers installers`
  
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=${process.env.GOOGLE_CSE_CX}&q=${encodeURIComponent(googleQuery)}&num=10`,
    {
      headers: {
        'User-Agent': 'SolarProvidersOnline/1.0'
      }
    }
  )

  if (!response.ok) {
    throw new Error('Google search failed')
  }

  const data = await response.json()
  const providers: Provider[] = []
  
  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      
      const provider: Provider = {
        id: `google-${i}-${Date.now()}`,
        name: extractProviderName(item.title, item.snippet),
        businessName: extractProviderName(item.title, item.snippet),
        location: extractLocation(item.title, item.snippet, address),
        address: extractAddress(item.title, item.snippet),
        city: extractCity(item.title, item.snippet, address),
        state: extractState(item.title, item.snippet, address),
        website: item.link,
        overallRating: '0',
        totalReviews: 0,
        specialties: extractSpecialties(item.snippet),
        description: item.snippet,
        isVerified: false,
        source: 'google',
        cachedAt: new Date().toISOString()
      }
      
      providers.push(provider)
    }
  }
  
  return providers
}

async function searchOverpassProviders(address: string, userLocation: any): Promise<Provider[]> {
  const { lat, lon } = userLocation
  
  // Search for solar-related businesses in the area
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["shop"="energy"]["solar"](around:50000,${lat},${lon});
      node["craft"="electrician"]["solar"](around:50000,${lat},${lon});
      node["office"="energy"]["solar"](around:50000,${lat},${lon});
      way["shop"="energy"]["solar"](around:50000,${lat},${lon});
      way["craft"="electrician"]["solar"](around:50000,${lat},${lon});
      way["office"="energy"]["solar"](around:50000,${lat},${lon});
    );
    out center;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SolarProvidersOnline/1.0'
    },
    body: `data=${encodeURIComponent(overpassQuery)}`
  })

  if (!response.ok) {
    throw new Error('Overpass search failed')
  }

  const data = await response.json()
  const providers: Provider[] = []
  
  if (data.elements && data.elements.length > 0) {
    for (let i = 0; i < data.elements.length; i++) {
      const element = data.elements[i]
      const tags = element.tags || {}
      
      if (tags.name) {
        const provider: Provider = {
          id: `overpass-${element.id}`,
          name: tags.name,
          businessName: tags.name,
          location: `${tags['addr:city'] || 'Unknown'}, ${tags['addr:state'] || 'Unknown'}`,
          address: `${tags['addr:housenumber'] || ''} ${tags['addr:street'] || ''}`.trim(),
          city: tags['addr:city'] || 'Unknown',
          state: tags['addr:state'] || 'Unknown',
          zipCode: tags['addr:postcode'],
          phone: tags.phone,
          website: tags.website,
          overallRating: '0',
          totalReviews: 0,
          specialties: ['Solar Installation', 'Energy Services'],
          description: `Solar energy services in ${tags['addr:city'] || 'the area'}`,
          isVerified: false,
          coordinates: element.lat && element.lon ? { lat: element.lat, lon: element.lon } : undefined,
          source: 'overpass',
          cachedAt: new Date().toISOString()
        }
        
        providers.push(provider)
      }
    }
  }
  
  return providers
}

async function searchDatabaseProviders(address: string, lat: number, lon: number, radius: number): Promise<Provider[]> {
  try {
    // Search for registered providers within the radius
    const providers = await db.installer.findMany({
      include: {
        specialties: {
          include: {
            specialty: true
          }
        },
        externalLinks: true
      },
      where: {
        lat: {
          gte: lat - (radius / 69), // Rough conversion: 1 degree ≈ 69 miles
          lte: lat + (radius / 69)
        },
        lon: {
          gte: lon - (radius / 69),
          lte: lon + (radius / 69)
        }
      }
    })

    return providers.map(provider => ({
      id: `db-${provider.id}`,
      name: provider.name,
      businessName: provider.name,
      location: `${provider.city}, ${provider.state}`,
      address: provider.address || '',
      city: provider.city || '',
      state: provider.state || '',
      zipCode: provider.postal || '',
      phone: provider.phone || '',
      website: provider.website || '',
      overallRating: '0',
      totalReviews: 0,
      specialties: provider.specialties.map(s => s.specialty.label),
      description: `Registered solar provider in ${provider.city}, ${provider.state}`,
      isVerified: true, // Database providers are verified
      coordinates: provider.lat && provider.lon ? { lat: provider.lat, lon: provider.lon } : undefined,
      source: 'database',
      cachedAt: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Database search error:', error)
    return []
  }
}

function removeDuplicateProviders(providers: Provider[]): Provider[] {
  const seen = new Set<string>()
  return providers.filter(provider => {
    const key = `${provider.name.toLowerCase()}-${provider.city.toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

async function cacheSearchResults(cacheKey: string, location: string, providers: Provider[], sources: string) {
  try {
    await db.searchResult.create({
      data: {
        engine: 'GOOGLE',
        query: `solar providers in ${location}`,
        location: location,
        title: `Solar Providers in ${location}`,
        url: `https://google.com/search?q=${encodeURIComponent(`solar providers in ${location}`)}`,
        snippet: JSON.stringify(providers),
        sourceRank: 1,
        hash: cacheKey
      }
    })
    console.log('Cached search results for:', location)
  } catch (error) {
    console.error('Failed to cache search results:', error)
  }
}

// Helper functions
function extractProviderName(title: string, snippet: string): string {
  const titleMatch = title.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-|–]\s*(Solar|Energy|Solar Energy|Solar Installer)/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  const firstPart = title.split(' - ')[0].split(' | ')[0].split(' – ')[0]
  return firstPart.length > 50 ? firstPart.substring(0, 50) + '...' : firstPart
}

function extractLocation(title: string, snippet: string, searchAddress: string): string {
  const locationMatch = title.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/i) ||
                       snippet.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/i)
  
  if (locationMatch) {
    return `${locationMatch[1]}, ${locationMatch[2]}`
  }
  
  return searchAddress
}

function extractAddress(title: string, snippet: string): string {
  const addressMatch = snippet.match(/(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive))/i)
  return addressMatch ? addressMatch[1] : ''
}

function extractCity(title: string, snippet: string, searchAddress: string): string {
  const location = extractLocation(title, snippet, searchAddress)
  return location.split(',')[0]?.trim() || ''
}

function extractState(title: string, snippet: string, searchAddress: string): string {
  const location = extractLocation(title, snippet, searchAddress)
  const parts = location.split(',')
  return parts.length > 1 ? parts[1]?.trim() || '' : ''
}

function extractSpecialties(snippet: string): string[] {
  const specialties: string[] = []
  
  const specialtyKeywords = [
    'residential solar', 'commercial solar', 'solar installation', 'solar panels',
    'solar energy', 'solar systems', 'rooftop solar', 'ground mount solar',
    'solar maintenance', 'solar repair', 'battery storage', 'solar financing'
  ]
  
  for (const keyword of specialtyKeywords) {
    if (snippet.toLowerCase().includes(keyword)) {
      specialties.push(keyword)
    }
  }
  
  return specialties.slice(0, 3)
}