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

  // Search using our server-side Nominatim proxy
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
    const { limit, country, signal } = options

    const url = new URL('/api/geocoding/search', window.location.origin)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('country', country)

    const response = await fetch(url.toString(), {
      signal
    })

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    return data
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const url = new URL('/api/geocoding/reverse', window.location.origin)
      url.searchParams.set('lat', lat.toString())
      url.searchParams.set('lng', lng.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data) {
        return null
      }

      return data

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
