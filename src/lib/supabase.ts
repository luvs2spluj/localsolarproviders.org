// Supabase Configuration and Client
// Provides Supabase client for database operations and real-time features

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qktumtzgbwsprueqqhsr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tQw1RTmzurTIYYbg7CnT9Q_3ZiNHEqm'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'd9HHXBKhdcuaKJ1_6bzhbg_eCHDbm67'

// Validate required environment variables
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set. Supabase features will be disabled.')
}

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Supabase features will be disabled.')
}

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Create Supabase client for server-side operations (with service role key)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database types (these should match your Supabase schema)
export interface SolarProvider {
  id: string
  name: string
  business_name?: string
  location: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  email?: string
  website?: string
  license_number?: string
  license_state?: string
  license_type?: string
  license_first_issued?: string
  license_last_renewed?: string
  years_in_business?: number
  employee_count?: number
  service_area?: string
  specialties?: string[]
  brands_worked_with?: string[]
  average_cost_per_watt?: number
  average_turnaround_days?: number
  estimated_installed_kw?: number
  overall_rating?: number
  total_reviews?: number
  total_leads?: number
  review_summary?: {
    avgRating: number
    numReviews: number
    topReviews: Array<{
      rating: number
      text: string
      source: string
    }>
  }
  is_verified?: boolean
  is_active?: boolean
  verification_date?: string
  profiles?: Record<string, any>
  last_crawled?: string
  crawl_sources?: Array<{
    source: string
    url: string
    timestamp: string
  }>
  normalized_name?: string
  created_at?: string
  updated_at?: string
}

export interface SolarReview {
  id: string
  provider_id: string
  rating: number
  review_text?: string
  reviewer_name?: string
  review_date?: string
  source: string
  source_url?: string
  verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface SolarLead {
  id: string
  provider_id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  project_address?: string
  project_size_kw?: number
  estimated_cost?: number
  status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface SolarUser {
  id: string
  email: string
  name?: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface SolarEmbedding {
  id: string
  provider_id: string
  embedding_vector: number[]
  content_type: string
  content: string
  model: string
  created_at?: string
}

// Database operations
export class SupabaseService {
  private client: any
  private adminClient: any

  constructor() {
    this.client = supabase
    this.adminClient = supabaseAdmin
  }

  // Check if Supabase is configured
  isConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey)
  }

  // Get solar providers with optional filters
  async getSolarProviders(filters?: {
    state?: string
    city?: string
    isVerified?: boolean
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    let query = this.client
      .from('solarreviews_providers')
      .select('*')

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.city) {
      query = query.eq('city', filters.city)
    }

    if (filters?.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch solar providers: ${error.message}`)
    }

    return data as SolarProvider[]
  }

  // Get a single solar provider by ID
  async getSolarProvider(id: string): Promise<SolarProvider | null> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch solar provider: ${error.message}`)
    }

    return data as SolarProvider
  }

  // Search solar providers by location
  async searchSolarProvidersByLocation(
    lat: number, 
    lng: number, 
    radiusKm: number = 50
  ): Promise<SolarProvider[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    // Use PostGIS for location-based search if available
    // For now, we'll do a simple text-based search
    const { data, error } = await this.client
      .from('solarreviews_providers')
      .select('*')
      .eq('is_active', true)
      .order('overall_rating', { ascending: false })

    if (error) {
      throw new Error(`Failed to search solar providers: ${error.message}`)
    }

    return data as SolarProvider[]
  }

  // Upsert a solar provider (create or update)
  async upsertSolarProvider(provider: Partial<SolarProvider>): Promise<SolarProvider> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_providers')
      .upsert(provider, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert solar provider: ${error.message}`)
    }

    return data as SolarProvider
  }

  // Get solar reviews for a provider
  async getSolarReviews(providerId: string): Promise<SolarReview[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_reviews')
      .select('*')
      .eq('provider_id', providerId)
      .order('review_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch solar reviews: ${error.message}`)
    }

    return data as SolarReview[]
  }

  // Create a new solar review
  async createSolarReview(review: Omit<SolarReview, 'id' | 'created_at' | 'updated_at'>): Promise<SolarReview> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_reviews')
      .insert(review)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create solar review: ${error.message}`)
    }

    return data as SolarReview
  }

  // Get solar leads for a provider
  async getSolarLeads(providerId: string): Promise<SolarLead[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_leads')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch solar leads: ${error.message}`)
    }

    return data as SolarLead[]
  }

  // Create a new solar lead
  async createSolarLead(lead: Omit<SolarLead, 'id' | 'created_at' | 'updated_at'>): Promise<SolarLead> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await this.client
      .from('solarreviews_leads')
      .insert(lead)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create solar lead: ${error.message}`)
    }

    return data as SolarLead
  }

  // Get database statistics
  async getStats(): Promise<{
    totalProviders: number
    verifiedProviders: number
    activeProviders: number
    totalReviews: number
    totalLeads: number
  }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    try {
      const [providersResult, reviewsResult, leadsResult] = await Promise.all([
        this.client.from('solarreviews_providers').select('id, is_verified, is_active', { count: 'exact' }),
        this.client.from('solarreviews_reviews').select('id', { count: 'exact' }),
        this.client.from('solarreviews_leads').select('id', { count: 'exact' })
      ])

      const totalProviders = providersResult.count || 0
      const verifiedProviders = providersResult.data?.filter(p => p.is_verified).length || 0
      const activeProviders = providersResult.data?.filter(p => p.is_active).length || 0
      const totalReviews = reviewsResult.count || 0
      const totalLeads = leadsResult.count || 0

      return {
        totalProviders,
        verifiedProviders,
        activeProviders,
        totalReviews,
        totalLeads
      }
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Real-time subscription for solar providers
  subscribeToSolarProviders(callback: (payload: any) => void) {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    return this.client
      .channel('solar-providers')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'solarreviews_providers' }, 
        callback
      )
      .subscribe()
  }

  // Real-time subscription for solar reviews
  subscribeToSolarReviews(providerId: string, callback: (payload: any) => void) {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured')
    }

    return this.client
      .channel(`solar-reviews-${providerId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'solarreviews_reviews', filter: `provider_id=eq.${providerId}` }, 
        callback
      )
      .subscribe()
  }
}

// Create singleton instance
export const supabaseService = new SupabaseService()

// Export the service as default
export default supabaseService
