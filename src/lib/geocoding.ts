// Nominatim (OpenStreetMap) geocoding service
export interface GeocodingResult {
  lat: number
  lon: number
  display_name: string
  address: {
    house_number?: string
    road?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  boundingbox: [string, string, string, string] // [min_lat, max_lat, min_lon, max_lon]
}

export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodedAddress}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SolarProvidersOnline/1.0 (https://solarprovidersonline.com)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return data.map((result: any) => ({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {},
      boundingbox: result.boundingbox
    }))
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SolarProvidersOnline/1.0 (https://solarprovidersonline.com)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {},
      boundingbox: result.boundingbox
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
