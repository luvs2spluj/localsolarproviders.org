// Website enrichment system - extracts specialties from installer websites
// Respects robots.txt and implements polite crawling

import { parse as parseRobotsTxt } from 'robots-txt-parser'

export interface EnrichmentResult {
  specialties: string[]
  success: boolean
  error?: string
  scannedAt: Date
}

// Specialty detection keywords
const SPECIALTY_KEYWORDS = {
  battery_backup: [
    'battery', 'storage', 'powerwall', 'enphase iq battery', 'solaredge home battery',
    'backup power', 'energy storage', 'tesla powerwall', 'battery backup', 'home battery'
  ],
  ev_charger: [
    'ev charger', 'evse', 'level 2', 'nema 14-50', 'wall connector', 'electric vehicle',
    'ev charging', 'tesla charger', 'chargepoint', 'ev installation'
  ],
  tile_roof: [
    'tile roof', 'clay tile', 'concrete tile', 'spanish tile', 'tile installation',
    'tile roofing', 'roof tile'
  ],
  metal_roof: [
    'metal roof', 'standing seam', 'corrugated metal', 'steel roof', 'aluminum roof',
    'metal roofing'
  ],
  ground_mount: [
    'ground mount', 'ground mounted', 'field installation', 'ground array', 
    'pole mount', 'ballasted system', 'carport', 'canopy'
  ],
  off_grid: [
    'off grid', 'off-grid', 'remote power', 'cabin solar', 'hybrid inverter',
    'standalone system', 'battery system', 'grid-tie with battery'
  ],
  microinverters: [
    'microinverter', 'micro inverter', 'enphase', 'iq8', 'iq7', 'module level',
    'mlpe', 'power optimizer'
  ],
  commercial_pv: [
    'commercial', 'business', 'industrial', 'c&i', 'warehouse', 'office building',
    'retail', 'manufacturing', 'agricultural'
  ],
  residential_pv: [
    'residential', 'home', 'house', 'homeowner', 'rooftop', 'family'
  ],
  roofing: [
    'roofing', 're-roof', 'roof replacement', 'shingle', 'comp roof', 'asphalt',
    'roof repair', 'roofing contractor'
  ],
  storage_only: [
    'battery only', 'storage only', 'retrofit battery', 'add battery',
    'existing solar'
  ],
  solar_maintenance: [
    'maintenance', 'repair', 'cleaning', 'service', 'troubleshooting',
    'system monitoring', 'performance optimization'
  ],
  energy_audit: [
    'energy audit', 'efficiency audit', 'home energy assessment', 'energy evaluation'
  ],
  financing: [
    'financing', 'solar loans', 'lease', 'ppa', 'power purchase agreement',
    'solar financing', 'payment plans', 'zero down'
  ],
  permits: [
    'permits', 'permitting', 'interconnection', 'utility coordination',
    'ahj approval', 'inspection'
  ],
  monitoring: [
    'monitoring', 'production monitoring', 'system monitoring', 'remote monitoring',
    'performance tracking', 'enphase enlighten', 'solaredge monitoring'
  ]
}

// Rate limiting for website requests
let lastWebsiteRequest = 0
const WEBSITE_REQUEST_INTERVAL = 2000 // 2 seconds between requests

async function rateLimitedWebsiteFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastWebsiteRequest
  
  if (timeSinceLastRequest < WEBSITE_REQUEST_INTERVAL) {
    const waitTime = WEBSITE_REQUEST_INTERVAL - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastWebsiteRequest = Date.now()
  
  return fetch(url, {
    headers: {
      'User-Agent': 'SolarProvidersOnline/1.0 (https://solarprovidersonline.com; educational research)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    signal: AbortSignal.timeout(15000) // 15 second timeout
  })
}

async function checkRobotsTxt(websiteUrl: string): Promise<boolean> {
  try {
    const url = new URL(websiteUrl)
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`
    
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'SolarProvidersOnline/1.0'
      }
    })
    
    if (!response.ok) {
      // No robots.txt means we can proceed
      return true
    }
    
    const robotsText = await response.text()
    const robots = parseRobotsTxt(robotsText)
    
    // Check if our user agent is allowed to access the site
    const userAgent = 'SolarProvidersOnline'
    const isAllowed = robots.isAllowed(userAgent, '/')
    
    return isAllowed
  } catch (error) {
    console.error('Error checking robots.txt:', error)
    // If we can't check robots.txt, err on the side of caution but allow
    return true
  }
}

function extractTextFromHTML(html: string): string {
  // Simple HTML text extraction - remove tags and scripts
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase()
    .trim()
}

function detectSpecialties(text: string): string[] {
  const detectedSpecialties: string[] = []
  
  for (const [specialtySlug, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    const hasKeyword = keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    )
    
    if (hasKeyword) {
      detectedSpecialties.push(specialtySlug)
    }
  }
  
  return detectedSpecialties
}

export async function enrichInstallerWebsite(websiteUrl: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    specialties: [],
    success: false,
    scannedAt: new Date()
  }
  
  if (!websiteUrl) {
    result.error = 'No website URL provided'
    return result
  }
  
  try {
    // Normalize URL
    let url = websiteUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    // Check robots.txt
    const robotsAllowed = await checkRobotsTxt(url)
    if (!robotsAllowed) {
      result.error = 'Robots.txt disallows crawling'
      return result
    }
    
    // Fetch the homepage
    const response = await rateLimitedWebsiteFetch(url)
    
    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`
      return result
    }
    
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      result.error = 'Not an HTML page'
      return result
    }
    
    const html = await response.text()
    
    // Extract text content
    const text = extractTextFromHTML(html)
    
    // Detect specialties
    result.specialties = detectSpecialties(text)
    result.success = true
    
    return result
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

// Batch enrichment with proper rate limiting
export async function enrichMultipleInstallers(
  websiteUrls: string[]
): Promise<Map<string, EnrichmentResult>> {
  const results = new Map<string, EnrichmentResult>()
  
  for (const url of websiteUrls) {
    try {
      console.log(`Enriching: ${url}`)
      const result = await enrichInstallerWebsite(url)
      results.set(url, result)
      
      // Log results
      if (result.success) {
        console.log(`✓ Found ${result.specialties.length} specialties: ${result.specialties.join(', ')}`)
      } else {
        console.log(`✗ Failed: ${result.error}`)
      }
      
    } catch (error) {
      console.error(`Error enriching ${url}:`, error)
      results.set(url, {
        specialties: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scannedAt: new Date()
      })
    }
  }
  
  return results
}

// Manual specialty keywords for admin interface
export function getSpecialtyKeywords(): Record<string, string[]> {
  return SPECIALTY_KEYWORDS
}

// Test a single text snippet for specialties (useful for admin)
export function testSpecialtyDetection(text: string): string[] {
  return detectSpecialties(text.toLowerCase())
}
