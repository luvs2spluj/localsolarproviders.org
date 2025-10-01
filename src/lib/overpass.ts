// OpenStreetMap Overpass API client for discovering solar installers
// Free to use, respects fair use policies

export interface OverpassResult {
  id: number
  type: 'node' | 'way' | 'relation'
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

export interface OverpassResponse {
  version: number
  generator: string
  elements: OverpassResult[]
}

export interface InstallerCandidate {
  osmId: string
  name: string
  lat: number
  lon: number
  address?: string
  city?: string
  state?: string
  postal?: string
  phone?: string
  website?: string
  source: 'overpass'
}

// Rate limiting: Overpass API fair use - max 1 request per 2 seconds
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequestTime = Date.now()
  
  return fetch(url, {
    headers: {
      'User-Agent': 'SolarProvidersOnline/1.0 (https://solarprovidersonline.com; educational/research use)'
    },
    signal: AbortSignal.timeout(25000) // 25 second timeout
  })
}

export async function discoverSolarInstallers(
  lat: number, 
  lon: number, 
  radiusMeters: number = 25000 // Default 25km radius
): Promise<InstallerCandidate[]> {
  
  // Validate inputs
  if (radiusMeters > 50000) {
    throw new Error('Radius too large. Maximum 50km for fair use.')
  }
  
  // Build Overpass query to find solar-related businesses
  const query = `
    [out:json][timeout:25];
    (
      // Nodes/ways/relations with "solar" in name
      nwr(around:${radiusMeters},${lat},${lon})["name"~"(?i)solar"];
      
      // Solar craft/trade businesses
      nwr(around:${radiusMeters},${lat},${lon})["craft"~"(?i)solar"];
      
      // Electrical shops that mention solar
      nwr(around:${radiusMeters},${lat},${lon})["shop"~"(?i)electrical|electronics"]["name"~"(?i)solar"];
      
      // Office/company with solar in name
      nwr(around:${radiusMeters},${lat},${lon})["office"~"(?i)company|it"]["name"~"(?i)solar"];
      
      // Solar brands/franchises
      nwr(around:${radiusMeters},${lat},${lon})["brand"~"(?i)solar"];
      
      // Energy companies with solar in name
      nwr(around:${radiusMeters},${lat},${lon})["office"="energy_supplier"]["name"~"(?i)solar"];
    );
    out center tags;
  `
  
  try {
    const url = 'https://overpass-api.de/api/interpreter'
    const response = await rateLimitedFetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'text/plain',
      }
    } as any)
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
    }
    
    const data: OverpassResponse = await response.json()
    
    return data.elements
      .filter(element => {
        // Must have a name
        if (!element.tags.name) return false
        
        // Must have coordinates
        const hasCoords = element.lat && element.lon || element.center?.lat && element.center?.lon
        if (!hasCoords) return false
        
        return true
      })
      .map(element => {
        const coords = element.center || { lat: element.lat!, lon: element.lon! }
        
        return {
          osmId: `${element.type}/${element.id}`,
          name: element.tags.name,
          lat: coords.lat,
          lon: coords.lon,
          address: buildAddress(element.tags),
          city: element.tags['addr:city'],
          state: element.tags['addr:state'],
          postal: element.tags['addr:postcode'],
          phone: element.tags.phone || element.tags['contact:phone'],
          website: element.tags.website || element.tags['contact:website'],
          source: 'overpass' as const
        }
      })
      .filter((candidate, index, arr) => {
        // Remove duplicates by name and rough location
        return arr.findIndex(other => 
          other.name.toLowerCase() === candidate.name.toLowerCase() &&
          Math.abs(other.lat - candidate.lat) < 0.001 &&
          Math.abs(other.lon - candidate.lon) < 0.001
        ) === index
      })
      
  } catch (error) {
    console.error('Overpass API error:', error)
    throw new Error(`Failed to discover installers: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = []
  
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber'])
  if (tags['addr:street']) parts.push(tags['addr:street'])
  
  return parts.length > 0 ? parts.join(' ') : undefined
}

// NABCEP directory search (free public directory)
export async function searchNABCEPDirectory(
  location: string
): Promise<InstallerCandidate[]> {
  // NABCEP has a public directory but no official API
  // We'll simulate this for now - in production you'd need to:
  // 1. Check NABCEP's robots.txt and terms
  // 2. Implement respectful scraping if allowed
  // 3. Or provide manual import functionality
  
  console.log(`NABCEP search for ${location} - manual import recommended`)
  
  // Return empty for now - implement manual CSV import instead
  return []
}

// Utility to convert address to coordinates using free Nominatim
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit Nominatim
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SolarProvidersOnline/1.0 (https://solarprovidersonline.com)'
      }
    })
    
    if (!response.ok) return null
    
    const results = await response.json()
    if (results.length === 0) return null
    
    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon)
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}
