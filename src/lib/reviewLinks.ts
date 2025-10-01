// External review links generator - creates outbound links to review sites
// No scraping, just intelligent linking to help users find reviews

export interface ReviewLink {
  kind: 'GOOGLE' | 'YELP' | 'BBB' | 'FACEBOOK' | 'NABCEP' | 'OTHER'
  url: string
  label: string
  description: string
}

export interface InstallerInfo {
  name: string
  city?: string
  state?: string
  phone?: string
  website?: string
}

export function generateReviewLinks(installer: InstallerInfo): ReviewLink[] {
  const links: ReviewLink[] = []
  const { name, city, state, phone, website } = installer
  
  // Google Maps/Reviews search link
  if (name && city && state) {
    const googleQuery = `${name} ${city} ${state} solar installer`
    links.push({
      kind: 'GOOGLE',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleQuery)}`,
      label: 'Google Reviews',
      description: 'Find this installer on Google Maps and read customer reviews'
    })
  }
  
  // Yelp search link
  if (name && city && state) {
    const yelpBusinessQuery = encodeURIComponent(name + ' solar')
    const yelpLocationQuery = encodeURIComponent(`${city}, ${state}`)
    links.push({
      kind: 'YELP',
      url: `https://www.yelp.com/search?find_desc=${yelpBusinessQuery}&find_loc=${yelpLocationQuery}`,
      label: 'Yelp Reviews',
      description: 'Search for this installer on Yelp and read customer experiences'
    })
  }
  
  // Better Business Bureau search
  if (name && city && state) {
    const bbbQuery = encodeURIComponent(name)
    const bbbLocation = encodeURIComponent(`${city}, ${state}`)
    links.push({
      kind: 'BBB',
      url: `https://www.bbb.org/search?find_text=${bbbQuery}&find_loc=${bbbLocation}`,
      label: 'BBB Profile',
      description: 'Check Better Business Bureau rating and complaint history'
    })
  }
  
  // Facebook business search
  if (name && city) {
    const facebookQuery = encodeURIComponent(`${name} ${city} solar`)
    links.push({
      kind: 'FACEBOOK',
      url: `https://www.facebook.com/search/pages/?q=${facebookQuery}`,
      label: 'Facebook Reviews',
      description: 'Find this installer on Facebook and read customer reviews'
    })
  }
  
  // NABCEP certified professional search
  if (name) {
    links.push({
      kind: 'NABCEP',
      url: `https://www.nabcep.org/certification/certified-installers/`,
      label: 'NABCEP Certification',
      description: 'Check if this installer has NABCEP certified professionals'
    })
  }
  
  // Angie's List / Angi search
  if (name && city && state) {
    const angiQuery = encodeURIComponent(`${name} solar installer`)
    const angiLocation = encodeURIComponent(`${city}, ${state}`)
    links.push({
      kind: 'OTHER',
      url: `https://www.angi.com/search?searchTerm=${angiQuery}&location=${angiLocation}`,
      label: 'Angi Reviews',
      description: 'Search for this installer on Angi (formerly Angie\'s List)'
    })
  }
  
  // HomeAdvisor search
  if (name && city && state) {
    const homeAdvisorQuery = encodeURIComponent(`${name} solar`)
    const homeAdvisorLocation = encodeURIComponent(`${city} ${state}`)
    links.push({
      kind: 'OTHER',
      url: `https://www.homeadvisor.com/c.Solar-Energy-Contractors.${homeAdvisorLocation}.html?searchTerm=${homeAdvisorQuery}`,
      label: 'HomeAdvisor',
      description: 'Find this installer on HomeAdvisor and read customer reviews'
    })
  }
  
  return links
}

// Generate state licensing board links
export function generateLicensingLinks(installer: InstallerInfo): ReviewLink[] {
  const links: ReviewLink[] = []
  const { state } = installer
  
  if (!state) return links
  
  // State-specific licensing board links
  const licensingBoards: Record<string, { url: string; name: string }> = {
    'CA': {
      url: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
      name: 'California Contractors State License Board'
    },
    'TX': {
      url: 'https://www.tdlr.texas.gov/LicenseSearch/',
      name: 'Texas Department of Licensing and Regulation'
    },
    'FL': {
      url: 'https://www.myfloridalicense.com/LicenseDetail.asp',
      name: 'Florida Department of Business and Professional Regulation'
    },
    'NY': {
      url: 'https://www.dos.ny.gov/licensing/licensesearch/license_search.html',
      name: 'New York State Department of State'
    },
    'AZ': {
      url: 'https://www.azroc.gov/SearchContractor',
      name: 'Arizona Registrar of Contractors'
    },
    'NV': {
      url: 'https://www.nscb.nv.gov/License-Search/',
      name: 'Nevada State Contractors Board'
    },
    'CO': {
      url: 'https://apps.colorado.gov/dora/licensing/lookup/LicenseLookup.aspx',
      name: 'Colorado Department of Regulatory Agencies'
    },
    'MA': {
      url: 'https://www.mass.gov/service-details/check-a-license',
      name: 'Massachusetts Division of Professional Licensure'
    }
  }
  
  const board = licensingBoards[state.toUpperCase()]
  if (board) {
    links.push({
      kind: 'OTHER',
      url: board.url,
      label: 'License Verification',
      description: `Verify contractor license with ${board.name}`
    })
  }
  
  return links
}

// Generate solar industry association links
export function generateIndustryLinks(installer: InstallerInfo): ReviewLink[] {
  const links: ReviewLink[] = []
  const { state } = installer
  
  // National Solar Energy Industries Association
  links.push({
    kind: 'OTHER',
    url: 'https://www.seia.org/solar-business-directory',
    label: 'SEIA Directory',
    description: 'Check if this installer is a member of the Solar Energy Industries Association'
  })
  
  // State-specific solar associations
  const stateAssociations: Record<string, { url: string; name: string }> = {
    'CA': {
      url: 'https://www.calssa.org/directory',
      name: 'California Solar & Storage Association'
    },
    'TX': {
      url: 'https://www.txsolar.org/members',
      name: 'Texas Solar Power Association'
    },
    'FL': {
      url: 'https://www.flasolar.org/members',
      name: 'Florida Solar Energy Industries Association'
    },
    'NY': {
      url: 'https://www.nyseia.org/members',
      name: 'New York Solar Energy Industries Association'
    },
    'AZ': {
      url: 'https://arizonasolar.org/members/',
      name: 'Arizona Solar Energy Industries Association'
    }
  }
  
  if (state) {
    const association = stateAssociations[state.toUpperCase()]
    if (association) {
      links.push({
        kind: 'OTHER',
        url: association.url,
        label: association.name,
        description: `Check membership in ${association.name}`
      })
    }
  }
  
  return links
}

// Combine all review and verification links
export function generateAllLinks(installer: InstallerInfo): {
  reviews: ReviewLink[]
  licensing: ReviewLink[]
  industry: ReviewLink[]
} {
  return {
    reviews: generateReviewLinks(installer),
    licensing: generateLicensingLinks(installer),
    industry: generateIndustryLinks(installer)
  }
}

// Helper to create a direct website link if available
export function createWebsiteLink(website?: string): ReviewLink | null {
  if (!website) return null
  
  let url = website
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  
  return {
    kind: 'OTHER',
    url,
    label: 'Official Website',
    description: 'Visit the installer\'s official website'
  }
}

// Helper to create a phone link if available
export function createPhoneLink(phone?: string): ReviewLink | null {
  if (!phone) return null
  
  // Clean phone number
  const cleanPhone = phone.replace(/[^\d]/g, '')
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return null
  
  return {
    kind: 'OTHER',
    url: `tel:${phone}`,
    label: 'Call Now',
    description: 'Call this installer directly'
  }
}
