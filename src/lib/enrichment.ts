// Solar Provider Enrichment Pipeline
// Enriches provider data with Google Places, Yelp, website scraping, and other sources

import { chromium, Browser, Page } from 'playwright'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

export interface EnrichmentData {
  googlePlaces?: {
    placeId: string
    rating: number
    userRatingsTotal: number
    reviews: Array<{
      rating: number
      text: string
      authorName: string
      time: number
    }>
    photos: string[]
    businessStatus: string
  }
  yelp?: {
    businessId: string
    rating: number
    reviewCount: number
    reviews: Array<{
      rating: number
      text: string
      user: string
      timeCreated: string
    }>
    categories: string[]
    price: string
  }
  website?: {
    specialties: string[]
    description: string
    services: string[]
    portfolio: Array<{
      title: string
      description: string
      systemSize?: number
      location?: string
    }>
    team: Array<{
      name: string
      title: string
      bio?: string
    }>
    certifications: string[]
    brands: string[]
  }
  estimatedCapacity?: {
    totalKw: number
    projects: number
    averageSystemSize: number
    confidence: number
  }
}

export interface EnrichmentResult {
  success: boolean
  data: EnrichmentData
  errors: string[]
  source: string
  timestamp: string
}

// Google Places API enrichment
export class GooglePlacesEnricher {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async enrichProvider(provider: any): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      success: false,
      data: {},
      errors: [],
      source: 'Google Places',
      timestamp: new Date().toISOString()
    }

    try {
      // Search for business
      const searchQuery = `${provider.name} ${provider.city} ${provider.state}`
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`
      
      const searchResponse = await axios.get(searchUrl)
      const searchResults = searchResponse.data.results

      if (searchResults.length === 0) {
        result.errors.push('No Google Places results found')
        return result
      }

      const place = searchResults[0]
      const placeId = place.place_id

      // Get detailed place information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,photos,formatted_address,formatted_phone_number,website,business_status&key=${this.apiKey}`
      
      const detailsResponse = await axios.get(detailsUrl)
      const details = detailsResponse.data.result

      result.data.googlePlaces = {
        placeId,
        rating: details.rating || 0,
        userRatingsTotal: details.user_ratings_total || 0,
        reviews: (details.reviews || []).map((review: any) => ({
          rating: review.rating,
          text: review.text,
          authorName: review.author_name,
          time: review.time
        })),
        photos: (details.photos || []).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ),
        businessStatus: details.business_status || 'OPERATIONAL'
      }

      result.success = true

    } catch (error) {
      result.errors.push(`Google Places enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }
}

// Website content enricher
export class WebsiteEnricher {
  private browser: Browser | null = null
  private page: Page | null = null

  async initialize() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await this.page.setDefaultTimeout(30000)
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async enrichProvider(provider: any): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      success: false,
      data: {},
      errors: [],
      source: 'Website',
      timestamp: new Date().toISOString()
    }

    if (!provider.website) {
      result.errors.push('No website URL provided')
      return result
    }

    if (!this.page) {
      throw new Error('Website enricher not initialized. Call initialize() first.')
    }

    try {
      console.log(`Enriching website: ${provider.website}`)
      
      // Navigate to website
      await this.page.goto(provider.website, { waitUntil: 'networkidle' })
      
      // Extract website content
      const websiteData = await this.page.evaluate(() => {
        const getTextContent = (selector: string) => {
          const element = document.querySelector(selector)
          return element?.textContent?.trim() || ''
        }

        const getTextContents = (selector: string) => {
          const elements = document.querySelectorAll(selector)
          return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean)
        }

        // Extract specialties from common sections
        const specialties: string[] = []
        const services: string[] = []
        const certifications: string[] = []
        const brands: string[] = []

        // Look for services/specialties sections
        const serviceSelectors = [
          'h2:contains("Services")', 'h3:contains("Services")',
          'h2:contains("Specialties")', 'h3:contains("Specialties")',
          'h2:contains("What We Do")', 'h3:contains("What We Do")',
          '.services', '.specialties', '.what-we-do'
        ]

        for (const selector of serviceSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const nextElement = element.nextElementSibling
            if (nextElement) {
              const items = nextElement.querySelectorAll('li, p, div')
              items.forEach(item => {
                const text = item.textContent?.trim()
                if (text && text.length > 3 && text.length < 100) {
                  services.push(text)
                }
              })
            }
          }
        }

        // Look for certifications
        const certSelectors = [
          'h2:contains("Certifications")', 'h3:contains("Certifications")',
          'h2:contains("Certified")', 'h3:contains("Certified")',
          '.certifications', '.certified'
        ]

        for (const selector of certSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const nextElement = element.nextElementSibling
            if (nextElement) {
              const items = nextElement.querySelectorAll('li, p, div')
              items.forEach(item => {
                const text = item.textContent?.trim()
                if (text && text.length > 3 && text.length < 100) {
                  certifications.push(text)
                }
              })
            }
          }
        }

        // Look for brands/equipment
        const brandSelectors = [
          'h2:contains("Brands")', 'h3:contains("Brands")',
          'h2:contains("Equipment")', 'h3:contains("Equipment")',
          'h2:contains("Partners")', 'h3:contains("Partners")',
          '.brands', '.equipment', '.partners'
        ]

        for (const selector of brandSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const nextElement = element.nextElementSibling
            if (nextElement) {
              const items = nextElement.querySelectorAll('li, p, div, img')
              items.forEach(item => {
                const text = item.textContent?.trim() || item.getAttribute('alt') || ''
                if (text && text.length > 2 && text.length < 50) {
                  brands.push(text)
                }
              })
            }
          }
        }

        // Extract portfolio/projects
        const portfolio: Array<{title: string, description: string, systemSize?: number, location?: string}> = []
        const portfolioSelectors = [
          'h2:contains("Portfolio")', 'h3:contains("Portfolio")',
          'h2:contains("Projects")', 'h3:contains("Projects")',
          'h2:contains("Case Studies")', 'h3:contains("Case Studies")',
          '.portfolio', '.projects', '.case-studies'
        ]

        for (const selector of portfolioSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const nextElement = element.nextElementSibling
            if (nextElement) {
              const items = nextElement.querySelectorAll('.project, .portfolio-item, .case-study, article, .card')
              items.forEach(item => {
                const title = item.querySelector('h3, h4, .title')?.textContent?.trim() || ''
                const description = item.querySelector('p, .description')?.textContent?.trim() || ''
                const systemSizeText = item.textContent?.match(/(\d+(?:\.\d+)?)\s*kW/i)?.[1]
                const systemSize = systemSizeText ? parseFloat(systemSizeText) : undefined
                
                if (title && description) {
                  portfolio.push({
                    title,
                    description,
                    systemSize,
                    location: provider.city
                  })
                }
              })
            }
          }
        }

        // Extract team information
        const team: Array<{name: string, title: string, bio?: string}> = []
        const teamSelectors = [
          'h2:contains("Team")', 'h3:contains("Team")',
          'h2:contains("About Us")', 'h3:contains("About Us")',
          'h2:contains("Staff")', 'h3:contains("Staff")',
          '.team', '.about-us', '.staff'
        ]

        for (const selector of teamSelectors) {
          const element = document.querySelector(selector)
          if (element) {
            const nextElement = element.nextElementSibling
            if (nextElement) {
              const items = nextElement.querySelectorAll('.team-member, .staff-member, .person, .employee')
              items.forEach(item => {
                const name = item.querySelector('h3, h4, .name')?.textContent?.trim() || ''
                const title = item.querySelector('.title, .position, .role')?.textContent?.trim() || ''
                const bio = item.querySelector('p, .bio, .description')?.textContent?.trim() || ''
                
                if (name) {
                  team.push({ name, title, bio })
                }
              })
            }
          }
        }

        // Get main description
        const description = getTextContent('meta[name="description"]') || 
                          getTextContent('h1') + ' ' + getTextContent('p') ||
                          getTextContent('.hero p') ||
                          getTextContent('.intro p')

        return {
          specialties: [...new Set(services)],
          description: description.substring(0, 500),
          services: [...new Set(services)],
          portfolio,
          team,
          certifications: [...new Set(certifications)],
          brands: [...new Set(brands)]
        }
      })

      result.data.website = websiteData
      result.success = true

    } catch (error) {
      result.errors.push(`Website enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }
}

// Capacity estimator
export class CapacityEstimator {
  estimateCapacity(provider: any, websiteData?: any): {
    totalKw: number
    projects: number
    averageSystemSize: number
    confidence: number
  } {
    let totalKw = 0
    let projects = 0
    let confidence = 0.3 // Low confidence by default

    // If we have portfolio data, use it
    if (websiteData?.portfolio) {
      const portfolioProjects = websiteData.portfolio.filter((p: any) => p.systemSize)
      if (portfolioProjects.length > 0) {
        totalKw = portfolioProjects.reduce((sum: number, p: any) => sum + (p.systemSize || 0), 0)
        projects = portfolioProjects.length
        confidence = 0.8
      }
    }

    // If no portfolio data, estimate based on years in business and reviews
    if (projects === 0) {
      const yearsInBusiness = provider.yearsInBusiness || 5
      const totalReviews = provider.totalReviews || 0
      
      // Estimate projects based on reviews (assuming 1 project per 2 reviews on average)
      projects = Math.max(10, Math.floor(totalReviews / 2) + (yearsInBusiness * 5))
      
      // Estimate average system size based on location and business size
      let averageSystemSize = 8.0 // Default residential system
      
      if (provider.city?.toLowerCase().includes('commercial') || 
          provider.specialties?.some((s: string) => s.toLowerCase().includes('commercial'))) {
        averageSystemSize = 50.0 // Commercial systems are larger
      }
      
      totalKw = projects * averageSystemSize
      confidence = 0.4
    }

    const averageSystemSize = projects > 0 ? totalKw / projects : 0

    return {
      totalKw: Math.round(totalKw * 100) / 100,
      projects,
      averageSystemSize: Math.round(averageSystemSize * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    }
  }
}

// Main enrichment pipeline
export class EnrichmentPipeline {
  private prisma: PrismaClient
  private googlePlacesEnricher?: GooglePlacesEnricher
  private websiteEnricher: WebsiteEnricher
  private capacityEstimator: CapacityEstimator

  constructor(googlePlacesApiKey?: string) {
    this.prisma = new PrismaClient()
    this.websiteEnricher = new WebsiteEnricher()
    this.capacityEstimator = new CapacityEstimator()
    
    if (googlePlacesApiKey) {
      this.googlePlacesEnricher = new GooglePlacesEnricher(googlePlacesApiKey)
    }
  }

  async initialize() {
    await this.websiteEnricher.initialize()
  }

  async close() {
    await this.websiteEnricher.close()
  }

  async enrichProvider(providerId: string): Promise<{
    success: boolean
    data: EnrichmentData
    errors: string[]
  }> {
    const provider = await this.prisma.installer.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return {
        success: false,
        data: {},
        errors: ['Provider not found']
      }
    }

    const enrichmentData: EnrichmentData = {}
    const errors: string[] = []

    // Google Places enrichment
    if (this.googlePlacesEnricher) {
      try {
        const googleResult = await this.googlePlacesEnricher.enrichProvider(provider)
        if (googleResult.success) {
          enrichmentData.googlePlaces = googleResult.data.googlePlaces
        } else {
          errors.push(...googleResult.errors)
        }
      } catch (error) {
        errors.push(`Google Places enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Website enrichment
    try {
      const websiteResult = await this.websiteEnricher.enrichProvider(provider)
      if (websiteResult.success) {
        enrichmentData.website = websiteResult.data.website
      } else {
        errors.push(...websiteResult.errors)
      }
    } catch (error) {
      errors.push(`Website enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Capacity estimation
    enrichmentData.estimatedCapacity = this.capacityEstimator.estimateCapacity(provider, enrichmentData.website)

    // Save enrichment data to database
    try {
      await this.prisma.installer.update({
        where: { id: providerId },
        data: {
          lastScannedAt: new Date(),
          // Update specialties if we found them
          specialties: enrichmentData.website?.specialties ? {
            create: enrichmentData.website.specialties.map(specialty => ({
              specialty: {
                connectOrCreate: {
                  where: { slug: specialty.toLowerCase().replace(/\s+/g, '-') },
                  create: { slug: specialty.toLowerCase().replace(/\s+/g, '-'), label: specialty }
                }
              }
            }))
          } : undefined
        }
      })
    } catch (error) {
      errors.push(`Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      success: errors.length === 0,
      data: enrichmentData,
      errors
    }
  }

  async enrichAllProviders(limit: number = 50): Promise<{
    processed: number
    errors: string[]
  }> {
    const providers = await this.prisma.installer.findMany({
      where: {
        OR: [
          { lastScannedAt: null },
          { lastScannedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days ago
        ]
      },
      take: limit
    })

    let processed = 0
    const errors: string[] = []

    for (const provider of providers) {
      try {
        const result = await this.enrichProvider(provider.id)
        if (result.success) {
          processed++
        } else {
          errors.push(...result.errors)
        }
        
        // Rate limiting - wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        errors.push(`Failed to enrich provider ${provider.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { processed, errors }
  }
}

// Main enrichment function
export async function enrichSolarProviders(
  providerId?: string,
  googlePlacesApiKey?: string
): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  const pipeline = new EnrichmentPipeline(googlePlacesApiKey)

  try {
    await pipeline.initialize()
    
    if (providerId) {
      // Enrich single provider
      const result = await pipeline.enrichProvider(providerId)
      return {
        success: result.success,
        processed: result.success ? 1 : 0,
        errors: result.errors
      }
    } else {
      // Enrich all providers
      const result = await pipeline.enrichAllProviders()
      return {
        success: result.errors.length === 0,
        processed: result.processed,
        errors: result.errors
      }
    }
    
  } catch (error) {
    console.error('Enrichment pipeline failed:', error)
    return {
      success: false,
      processed: 0,
      errors: [`Enrichment pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  } finally {
    await pipeline.close()
  }
}
