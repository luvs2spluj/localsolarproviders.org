// Search Integration Service
// Integrates Nominatim geocoding with Supabase solar providers database

import { geocodingService } from './geocodingService'
import { supabaseService } from './supabase'

export interface SearchResult {
  location: {
    address: string
    coordinates: { lat: number; lng: number }
    city?: string
    state?: string
    country?: string
  }
  providers: any[]
  total: number
  radius: number
}

export interface SearchOptions {
  radius?: number
  limit?: number
  includeInactive?: boolean
  minRating?: number
  verifiedOnly?: boolean
}

export class SearchIntegrationService {
  private geocodingService: typeof geocodingService
  private supabaseService: typeof supabaseService

  constructor() {
    this.geocodingService = geocodingService
    this.supabaseService = supabaseService
  }

  /**
   * Search for solar providers by address
   */
  async searchByAddress(
    address: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const {
      radius = 50,
      limit = 50,
      includeInactive = false,
      minRating = 0,
      verifiedOnly = false
    } = options

    // Geocode the address
    const geocodeResults = await this.geocodingService.searchAddresses(address, {
      limit: 1,
      country: 'US'
    })

    if (geocodeResults.length === 0) {
      throw new Error('Address not found')
    }

    const result = geocodeResults[0]
    const location = {
      address: result.label,
      coordinates: { lat: result.lat, lng: result.lng },
      city: result.address?.city,
      state: result.address?.state,
      country: result.address?.country || 'US'
    }

    // Search for providers
    const providers = await this.searchProvidersByLocation(
      location.coordinates.lat,
      location.coordinates.lng,
      radius,
      { limit, includeInactive, minRating, verifiedOnly }
    )

    return {
      location,
      providers,
      total: providers.length,
      radius
    }
  }

  /**
   * Search for solar providers by coordinates
   */
  async searchByCoordinates(
    lat: number,
    lng: number,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const {
      radius = 50,
      limit = 50,
      includeInactive = false,
      minRating = 0,
      verifiedOnly = false
    } = options

    // Reverse geocode to get address details
    const geocodeResult = await this.geocodingService.reverseGeocode(lat, lng)
    
    const location = {
      address: geocodeResult?.label || `${lat}, ${lng}`,
      coordinates: { lat, lng },
      city: geocodeResult?.address?.city,
      state: geocodeResult?.address?.state,
      country: geocodeResult?.address?.country || 'US'
    }

    // Search for providers
    const providers = await this.searchProvidersByLocation(
      lat,
      lng,
      radius,
      { limit, includeInactive, minRating, verifiedOnly }
    )

    return {
      location,
      providers,
      total: providers.length,
      radius
    }
  }

  /**
   * Search for solar providers by location with filters
   */
  private async searchProvidersByLocation(
    lat: number,
    lng: number,
    radiusKm: number,
    options: {
      limit: number
      includeInactive: boolean
      minRating: number
      verifiedOnly: boolean
    }
  ) {
    try {
      // Build Supabase query
      let query = this.supabaseService.client
        .from('solarreviews_providers')
        .select('*')

      // Apply filters
      if (!options.includeInactive) {
        query = query.eq('is_active', true)
      }

      if (options.verifiedOnly) {
        query = query.eq('is_verified', true)
      }

      if (options.minRating > 0) {
        query = query.gte('overall_rating', options.minRating)
      }

      // Order by rating
      query = query.order('overall_rating', { ascending: false })

      const { data: allProviders, error } = await query

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`)
      }

      if (!allProviders || allProviders.length === 0) {
        return []
      }

      // Filter providers by distance
      const filteredProviders = allProviders
        .map((provider: any) => {
          let distance = null
          
          if (provider.lat && provider.lng) {
            distance = this.calculateDistance(lat, lng, provider.lat, provider.lng)
          }

          return {
            ...provider,
            distance
          }
        })
        .filter((provider: any) => {
          // Include providers within radius or without coordinates (fallback to state matching)
          if (provider.distance !== null) {
            return provider.distance <= radiusKm
          }
          
          // For providers without coordinates, include if they're in the same state
          // This is a fallback for providers that haven't been geocoded yet
          return true
        })
        .sort((a: any, b: any) => {
          // Sort by rating first, then by distance
          if (a.overall_rating !== b.overall_rating) {
            return (b.overall_rating || 0) - (a.overall_rating || 0)
          }
          
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance
          }
          
          return 0
        })
        .slice(0, options.limit)

      return filteredProviders

    } catch (error) {
      console.error('Error searching providers by location:', error)
      throw error
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Get provider details with reviews
   */
  async getProviderDetails(providerId: string) {
    try {
      const provider = await this.supabaseService.getSolarProvider(providerId)
      
      if (!provider) {
        return null
      }

      const reviews = await this.supabaseService.getSolarReviews(providerId)

      return {
        provider,
        reviews,
        totalReviews: reviews.length
      }
    } catch (error) {
      console.error('Error getting provider details:', error)
      throw error
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      return await this.supabaseService.getStats()
    } catch (error) {
      console.error('Error getting database stats:', error)
      throw error
    }
  }
}

// Create singleton instance
export const searchIntegrationService = new SearchIntegrationService()

// Export as default
export default searchIntegrationService
