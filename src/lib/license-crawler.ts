// C-46 Solar Installer License Crawler
// Crawls California CSLB and other state licensing boards for solar installer licenses

import { chromium, Browser, Page } from 'playwright'
import { PrismaClient } from '@prisma/client'

export interface LicenseData {
  licenseNumber: string
  businessName: string
  ownerName?: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string
  email?: string
  website?: string
  licenseType: string // C-46, C-10, etc.
  licenseStatus: string
  issueDate?: string
  expirationDate?: string
  specialties?: string[]
  source: string
  sourceUrl: string
}

export interface CrawlResult {
  success: boolean
  data: LicenseData[]
  errors: string[]
  source: string
  timestamp: string
}

// California CSLB C-46 License Crawler
export class CSLBCrawler {
  private browser: Browser | null = null
  private page: Page | null = null

  async initialize() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    
    // Set user agent to avoid blocking
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Set reasonable timeouts
    await this.page.setDefaultTimeout(30000)
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async crawlC46Licenses(searchTerm: string = 'solar'): Promise<CrawlResult> {
    if (!this.page) {
      throw new Error('Crawler not initialized. Call initialize() first.')
    }

    const result: CrawlResult = {
      success: false,
      data: [],
      errors: [],
      source: 'CSLB',
      timestamp: new Date().toISOString()
    }

    try {
      console.log(`Crawling CSLB for C-46 licenses with search term: ${searchTerm}`)
      
      // Navigate to CSLB license lookup
      await this.page.goto('https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx')
      
      // Wait for page to load
      await this.page.waitForSelector('#MainContent_txtLicenseNumber', { timeout: 10000 })
      
      // Search by business name containing "solar"
      await this.page.fill('#MainContent_txtBusinessName', searchTerm)
      
      // Click search button
      await this.page.click('#MainContent_btnSearch')
      
      // Wait for results
      await this.page.waitForSelector('#MainContent_gvResults', { timeout: 15000 })
      
      // Extract license data from results table
      const licenses = await this.page.evaluate(() => {
        const results: any[] = []
        const rows = document.querySelectorAll('#MainContent_gvResults tr')
        
        for (let i = 1; i < rows.length; i++) { // Skip header row
          const row = rows[i]
          const cells = row.querySelectorAll('td')
          
          if (cells.length >= 6) {
            const licenseNumber = cells[0]?.textContent?.trim()
            const businessName = cells[1]?.textContent?.trim()
            const ownerName = cells[2]?.textContent?.trim()
            const address = cells[3]?.textContent?.trim()
            const city = cells[4]?.textContent?.trim()
            const licenseType = cells[5]?.textContent?.trim()
            
            if (licenseNumber && businessName && licenseType?.includes('C-46')) {
              results.push({
                licenseNumber,
                businessName,
                ownerName,
                address,
                city,
                licenseType,
                licenseStatus: 'Active', // CSLB shows active licenses by default
                source: 'CSLB',
                sourceUrl: window.location.href
              })
            }
          }
        }
        
        return results
      })
      
      result.data = licenses
      result.success = true
      
      console.log(`Found ${licenses.length} C-46 licenses`)
      
    } catch (error) {
      console.error('CSLB crawl error:', error)
      result.errors.push(`CSLB crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  async getLicenseDetails(licenseNumber: string): Promise<LicenseData | null> {
    if (!this.page) {
      throw new Error('Crawler not initialized. Call initialize() first.')
    }

    try {
      console.log(`Getting details for license: ${licenseNumber}`)
      
      // Navigate to license lookup
      await this.page.goto('https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx')
      
      // Search by license number
      await this.page.fill('#MainContent_txtLicenseNumber', licenseNumber)
      await this.page.click('#MainContent_btnSearch')
      
      // Wait for results
      await this.page.waitForSelector('#MainContent_gvResults', { timeout: 10000 })
      
      // Click on the license to get details
      const licenseLink = await this.page.$(`a[href*="LicenseDetail"]`)
      if (licenseLink) {
        await licenseLink.click()
        await this.page.waitForSelector('#MainContent_lblLicenseNumber', { timeout: 10000 })
        
        // Extract detailed license information
        const details = await this.page.evaluate(() => {
          const getTextContent = (selector: string) => {
            const element = document.querySelector(selector)
            return element?.textContent?.trim() || ''
          }
          
          return {
            licenseNumber: getTextContent('#MainContent_lblLicenseNumber'),
            businessName: getTextContent('#MainContent_lblBusinessName'),
            ownerName: getTextContent('#MainContent_lblOwnerName'),
            address: getTextContent('#MainContent_lblAddress'),
            city: getTextContent('#MainContent_lblCity'),
            state: 'CA',
            zipCode: getTextContent('#MainContent_lblZipCode'),
            phone: getTextContent('#MainContent_lblPhone'),
            licenseType: getTextContent('#MainContent_lblLicenseType'),
            licenseStatus: getTextContent('#MainContent_lblStatus'),
            issueDate: getTextContent('#MainContent_lblIssueDate'),
            expirationDate: getTextContent('#MainContent_lblExpirationDate'),
            source: 'CSLB',
            sourceUrl: window.location.href
          }
        })
        
        return details
      }
      
    } catch (error) {
      console.error(`Error getting details for license ${licenseNumber}:`, error)
    }

    return null
  }
}

// Multi-state license crawler
export class MultiStateLicenseCrawler {
  private crawlers: Map<string, any> = new Map()

  async crawlAllStates(searchTerm: string = 'solar'): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    
    // California CSLB
    const cslbCrawler = new CSLBCrawler()
    try {
      await cslbCrawler.initialize()
      const cslbResult = await cslbCrawler.crawlC46Licenses(searchTerm)
      results.push(cslbResult)
    } catch (error) {
      console.error('CSLB crawl failed:', error)
      results.push({
        success: false,
        data: [],
        errors: [`CSLB crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        source: 'CSLB',
        timestamp: new Date().toISOString()
      })
    } finally {
      await cslbCrawler.close()
    }

    // TODO: Add other state crawlers
    // - Texas (TECL)
    // - Arizona (ROC)
    // - Florida (CILB)
    // - New York (DOL)
    // etc.

    return results
  }
}

// License data processor
export class LicenseDataProcessor {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async processCrawlResults(results: CrawlResult[]): Promise<{
    processed: number
    errors: string[]
  }> {
    let processed = 0
    const errors: string[] = []

    for (const result of results) {
      if (!result.success) {
        errors.push(...result.errors)
        continue
      }

      for (const licenseData of result.data) {
        try {
          await this.upsertLicenseData(licenseData)
          processed++
        } catch (error) {
          errors.push(`Failed to process license ${licenseData.licenseNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return { processed, errors }
  }

  private async upsertLicenseData(licenseData: LicenseData): Promise<void> {
    // Normalize business name for deduplication
    const normalizedName = this.normalizeBusinessName(licenseData.businessName)
    
    // Check if provider already exists
    const existingProvider = await this.prisma.installer.findFirst({
      where: {
        OR: [
          { osmId: licenseData.licenseNumber },
          { name: { contains: licenseData.businessName, mode: 'insensitive' } }
        ]
      }
    })

    if (existingProvider) {
      // Update existing provider with license data
      await this.prisma.installer.update({
        where: { id: existingProvider.id },
        data: {
          name: licenseData.businessName,
          address: licenseData.address,
          city: licenseData.city,
          state: licenseData.state,
          postal: licenseData.zipCode,
          phone: licenseData.phone,
          website: licenseData.website,
          lastScannedAt: new Date(),
          // Add license data to external links
          externalLinks: {
            create: {
              kind: 'OTHER',
              url: licenseData.sourceUrl
            }
          }
        }
      })
    } else {
      // Create new provider
      await this.prisma.installer.create({
        data: {
          osmId: licenseData.licenseNumber,
          name: licenseData.businessName,
          address: licenseData.address,
          city: licenseData.city,
          state: licenseData.state,
          postal: licenseData.zipCode,
          phone: licenseData.phone,
          website: licenseData.website,
          lat: 0, // Will be geocoded later
          lon: 0, // Will be geocoded later
          lastScannedAt: new Date(),
          externalLinks: {
            create: {
              kind: 'OTHER',
              url: licenseData.sourceUrl
            }
          }
        }
      })
    }
  }

  private normalizeBusinessName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
}

// Main crawler function
export async function crawlSolarLicenses(searchTerm: string = 'solar'): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  const crawler = new MultiStateLicenseCrawler()
  const processor = new LicenseDataProcessor()

  try {
    console.log(`Starting license crawl for term: ${searchTerm}`)
    
    const results = await crawler.crawlAllStates(searchTerm)
    const { processed, errors } = await processor.processCrawlResults(results)
    
    console.log(`License crawl completed. Processed: ${processed}, Errors: ${errors.length}`)
    
    return {
      success: errors.length === 0,
      processed,
      errors
    }
    
  } catch (error) {
    console.error('License crawl failed:', error)
    return {
      success: false,
      processed: 0,
      errors: [`License crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}
