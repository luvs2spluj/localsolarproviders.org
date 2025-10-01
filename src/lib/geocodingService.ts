// Nominatim Geocoding Service
// Provides address search and geocoding using OpenStreetMap's Nominatim service

export interface GeocodingOptions {
  limit?: number
  country?: string
  language?: string
  focusPoint?: { lat: number; lng: number }
  bbox?: [number, number, number, number] // [left, top, right, bottom]
  allowNominatimFallback?: boolean
}

export interface GeocodingResult {
  id: string
  name: string
  label: string
  lat: number
  lng: number
  address?: {
    house_number?: string
    road?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  importance?: number
  place_rank?: number
  category?: string
  type?: string
  isHistory?: boolean
  isNoResults?: boolean
}

class GeocodingService {
  private usFocusPoint = { lat: 37.7749, lng: -122.4194 } // San Francisco
  private usBbox: [number, number, number, number] = [-125, 25, -66, 50] // US bounding box
  private cache = new Map<string, GeocodingResult[]>()
  private requestController: AbortController | null = null

  constructor() {
    // Clear cache periodically to prevent memory leaks
    setInterval(() => {
      this.clearCache()
    }, 5 * 60 * 1000) // Clear every 5 minutes
  }

  // Clear the geocoding cache
  clearCache() {
    this.cache.clear()
  }

  // Search for addresses using Nominatim
  async searchAddresses(query: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    const {
      limit = 8,
      country = 'US',
      language = 'en',
      focusPoint = this.usFocusPoint,
      bbox = this.usBbox,
      allowNominatimFallback = true
    } = options

    // Validate query
    if (!query || query.trim().length < 1) {
      return []
    }

    const normalizedQuery = query.trim().toLowerCase()
    
    // Check cache first
    if (this.cache.has(normalizedQuery)) {
      return this.cache.get(normalizedQuery)!
    }

    // Cancel previous request
    if (this.requestController) {
      this.requestController.abort()
    }

    this.requestController = new AbortController()

    try {
      const results = await this.searchNominatim(query, {
        limit,
        country,
        language,
        focusPoint,
        bbox,
        signal: this.requestController.signal
      })

      // Cache the results
      this.cache.set(normalizedQuery, results)

      return results

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, return empty array
        return []
      }

      console.error('Geocoding service error:', error)
      
      if (allowNominatimFallback) {
        // Try a simpler search as fallback
        try {
          const fallbackResults = await this.searchNominatim(query, {
            limit: 5,
            country: 'US',
            signal: this.requestController.signal
          })
          
          this.cache.set(normalizedQuery, fallbackResults)
          return fallbackResults
        } catch (fallbackError) {
          console.error('Fallback geocoding error:', fallbackError)
          return []
        }
      }

      return []
    }
  }

  // Search using Nominatim API
  private async searchNominatim(
    query: string, 
    options: {
      limit: number
      country: string
      language: string
      focusPoint: { lat: number; lng: number }
      bbox: [number, number, number, number]
      signal?: AbortSignal
    }
  ): Promise<GeocodingResult[]> {
    const { limit, country, language, focusPoint, bbox, signal } = options

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('countrycodes', country.toLowerCase())
    url.searchParams.set('dedupe', '1')
    url.searchParams.set('language', language)
    
    // Add viewbox for better US results
    url.searchParams.set('viewbox', `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`)
    url.searchParams.set('bounded', '1')

    // Add focus point for better relevance
    url.searchParams.set('lat', focusPoint.lat.toString())
    url.searchParams.set('lon', focusPoint.lng.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LocalSolarProviders/1.0 (contact@localsolarproviders.org)',
        'Accept': 'application/json'
      },
      signal
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    // Transform Nominatim results to our format
    return data.map((item: any, index: number) => ({
      id: `nominatim_${item.place_id || index}`,
      name: item.name || item.display_name.split(',')[0] || query,
      label: item.display_name || item.name || query,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address ? {
        house_number: item.address.house_number,
        road: item.address.road,
        city: item.address.city || item.address.town || item.address.village,
        state: item.address.state,
        postcode: item.address.postcode,
        country: item.address.country
      } : undefined,
      importance: item.importance,
      place_rank: item.place_rank,
      category: item.category,
      type: item.type
    }))
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse')
      url.searchParams.set('lat', lat.toString())
      url.searchParams.set('lon', lng.toString())
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('addressdetails', '1')

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'LocalSolarProviders/1.0 (contact@localsolarproviders.org)',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding error: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.lat || !data.lon) {
        return null
      }

      return {
        id: `reverse_${data.place_id}`,
        name: data.name || data.display_name.split(',')[0],
        label: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        address: data.address ? {
          house_number: data.address.house_number,
          road: data.address.road,
          city: data.address.city || data.address.town || data.address.village,
          state: data.address.state,
          postcode: data.address.postcode,
          country: data.address.country
        } : undefined,
        importance: data.importance,
        place_rank: data.place_rank,
        category: data.category,
        type: data.type
      }

    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  // Get current location using browser geolocation
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }
}

// Create singleton instance
const geocodingService = new GeocodingService()

// Export the service and types
export { geocodingService }
export default geocodingService

// Export the searchAddresses function for backward compatibility
export const searchAddresses = (query: string, options?: GeocodingOptions) => 
  geocodingService.searchAddresses(query, options)

// Export clearCache function for global access
export const clearGeocodingCache = () => geocodingService.clearCache()

// Make clearGeocodingCache available globally for the autocomplete component
if (typeof window !== 'undefined') {
  (window as any).clearGeocodingCache = clearGeocodingCache
}
