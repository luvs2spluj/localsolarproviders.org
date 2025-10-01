// ChatGPT-powered solar provider search
// This simulates what ChatGPT would return for solar provider searches

export interface ChatGPTProvider {
  name: string
  businessName: string
  location: string
  address?: string
  city: string
  state: string
  zipCode?: string
  phone?: string
  website?: string
  overallRating: string
  totalReviews: number
  specialties: string[]
  description: string
  yearEstablished?: number
  licenseNumber?: string
  isVerified: boolean
  coordinates?: {
    lat: number
    lon: number
  }
}

// Simulated ChatGPT responses for different locations
const CHATGPT_PROVIDER_DATABASE: Record<string, ChatGPTProvider[]> = {
  'san francisco': [
    {
      name: 'SunPower Bay Area',
      businessName: 'SunPower Corporation',
      location: 'San Francisco, CA',
      address: '77 Rio Robles',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95134',
      phone: '(800) 786-7693',
      website: 'https://sunpower.com',
      overallRating: '4.5',
      totalReviews: 1250,
      specialties: ['Residential Solar', 'Commercial Solar', 'Battery Storage', 'Solar Financing'],
      description: 'Leading solar manufacturer and installer with premium efficiency panels and comprehensive warranties.',
      yearEstablished: 1985,
      licenseNumber: 'CSLB #1234567',
      isVerified: true,
      coordinates: { lat: 37.4419, lon: -121.9430 }
    },
    {
      name: 'Tesla Solar SF',
      businessName: 'Tesla Energy',
      location: 'San Francisco, CA',
      address: '901 Page Ave',
      city: 'Fremont',
      state: 'CA',
      zipCode: '94538',
      phone: '(888) 765-2489',
      website: 'https://tesla.com/solar',
      overallRating: '4.2',
      totalReviews: 890,
      specialties: ['Solar Roof', 'Solar Panels', 'Powerwall Battery', 'EV Charger Installation'],
      description: 'Innovative solar solutions including Solar Roof tiles and Powerwall battery storage systems.',
      yearEstablished: 2016,
      licenseNumber: 'CSLB #2345678',
      isVerified: true,
      coordinates: { lat: 37.5485, lon: -121.9886 }
    },
    {
      name: 'Sungevity Bay Area',
      businessName: 'Sungevity Inc',
      location: 'Oakland, CA',
      address: '1414 Harbour Way S',
      city: 'Richmond',
      state: 'CA',
      zipCode: '94804',
      phone: '(855) 786-4387',
      website: 'https://sungevity.com',
      overallRating: '4.3',
      totalReviews: 650,
      specialties: ['Residential Solar', 'Solar Financing', 'Battery Backup', 'Solar Maintenance'],
      description: 'Customer-focused solar installer with competitive pricing and excellent customer service.',
      yearEstablished: 2007,
      licenseNumber: 'CSLB #3456789',
      isVerified: true,
      coordinates: { lat: 37.9358, lon: -122.3477 }
    },
    {
      name: 'Petersen-Dean Solar',
      businessName: 'Petersen-Dean Inc',
      location: 'Fremont, CA',
      address: '5800 Hollis St',
      city: 'Emeryville',
      state: 'CA',
      zipCode: '94608',
      phone: '(888) 748-3326',
      website: 'https://petersendean.com',
      overallRating: '4.1',
      totalReviews: 420,
      specialties: ['Roofing', 'Solar Installation', 'Battery Storage', 'HVAC'],
      description: 'Full-service contractor specializing in roofing and solar with over 50 years of experience.',
      yearEstablished: 1984,
      licenseNumber: 'CSLB #4567890',
      isVerified: true,
      coordinates: { lat: 37.8403, lon: -122.2888 }
    }
  ],
  'los angeles': [
    {
      name: 'Solar Optimum',
      businessName: 'Solar Optimum Inc',
      location: 'Los Angeles, CA',
      address: '1777 Botelho Dr',
      city: 'Walnut',
      state: 'CA',
      zipCode: '91789',
      phone: '(888) 710-5888',
      website: 'https://solaroptimum.com',
      overallRating: '4.6',
      totalReviews: 980,
      specialties: ['Residential Solar', 'Commercial Solar', 'Tesla Powerwall', 'EV Chargers'],
      description: 'Award-winning solar installer serving Southern California with premium equipment and service.',
      yearEstablished: 2008,
      licenseNumber: 'CSLB #5678901',
      isVerified: true,
      coordinates: { lat: 34.0522, lon: -118.2437 }
    },
    {
      name: 'LA Solar Group',
      businessName: 'LA Solar Group LLC',
      location: 'Los Angeles, CA',
      address: '1055 W 7th St',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90017',
      phone: '(213) 444-7765',
      website: 'https://lasolargroup.com',
      overallRating: '4.4',
      totalReviews: 750,
      specialties: ['Residential Solar', 'Battery Storage', 'Solar Financing', 'Ground Mount'],
      description: 'Local solar installer with competitive pricing and personalized service for LA area.',
      yearEstablished: 2012,
      licenseNumber: 'CSLB #6789012',
      isVerified: true,
      coordinates: { lat: 34.0522, lon: -118.2437 }
    }
  ],
  'phoenix': [
    {
      name: 'Harmon Solar',
      businessName: 'Harmon Solar LLC',
      location: 'Phoenix, AZ',
      address: '1950 E Watkins St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85034',
      phone: '(602) 467-9874',
      website: 'https://harmonsolar.com',
      overallRating: '4.7',
      totalReviews: 560,
      specialties: ['Residential Solar', 'Battery Storage', 'Pool Solar Heating', 'Commercial Solar'],
      description: 'Arizona-based solar installer specializing in desert climate installations with excellent warranties.',
      yearEstablished: 2009,
      licenseNumber: 'ROC #7890123',
      isVerified: true,
      coordinates: { lat: 33.4484, lon: -112.0740 }
    }
  ],
  'austin': [
    {
      name: 'Freedom Solar Power',
      businessName: 'Freedom Solar Power LLC',
      location: 'Austin, TX',
      address: '10925 Jones Rd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77065',
      phone: '(800) 504-2337',
      website: 'https://freedomsolarpower.com',
      overallRating: '4.5',
      totalReviews: 890,
      specialties: ['Residential Solar', 'Commercial Solar', 'Battery Backup', 'EV Chargers'],
      description: 'Texas largest solar installer with comprehensive solar solutions and financing options.',
      yearEstablished: 2007,
      licenseNumber: 'TECL #8901234',
      isVerified: true,
      coordinates: { lat: 30.2672, lon: -97.7431 }
    }
  ]
}

export async function searchProvidersWithChatGPT(
  location: string,
  specialties?: string[],
  radius?: number
): Promise<{
  providers: ChatGPTProvider[]
  searchQuery: string
  source: string
}> {
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Normalize location for search
  const normalizedLocation = location.toLowerCase()
  
  // Find matching providers
  let providers: ChatGPTProvider[] = []
  
  // Check for city matches
  for (const [city, cityProviders] of Object.entries(CHATGPT_PROVIDER_DATABASE)) {
    if (normalizedLocation.includes(city) || city.includes(normalizedLocation.split(',')[0])) {
      providers = [...providers, ...cityProviders]
    }
  }
  
  // If no specific matches, return a sample set
  if (providers.length === 0) {
    providers = [
      {
        name: 'Local Solar Solutions',
        businessName: 'Local Solar Solutions LLC',
        location: location,
        city: location.split(',')[0] || 'Unknown',
        state: location.split(',')[1]?.trim() || 'Unknown',
        phone: '(555) 123-4567',
        website: 'https://localsolar.com',
        overallRating: '4.3',
        totalReviews: 245,
        specialties: ['Residential Solar', 'Battery Storage', 'Solar Maintenance'],
        description: `Local solar installer serving the ${location} area with competitive pricing and quality installations.`,
        yearEstablished: 2015,
        isVerified: false
      },
      {
        name: 'Green Energy Pros',
        businessName: 'Green Energy Professionals Inc',
        location: location,
        city: location.split(',')[0] || 'Unknown',
        state: location.split(',')[1]?.trim() || 'Unknown',
        phone: '(555) 987-6543',
        website: 'https://greenergypros.com',
        overallRating: '4.1',
        totalReviews: 180,
        specialties: ['Commercial Solar', 'Ground Mount', 'EV Chargers'],
        description: `Experienced solar contractor providing comprehensive solar solutions in ${location}.`,
        yearEstablished: 2011,
        isVerified: true
      }
    ]
  }
  
  // Filter by specialties if provided
  if (specialties && specialties.length > 0) {
    providers = providers.filter(provider =>
      specialties.some(specialty =>
        provider.specialties.some(providerSpecialty =>
          providerSpecialty.toLowerCase().includes(specialty.toLowerCase())
        )
      )
    )
  }
  
  return {
    providers,
    searchQuery: `Solar installers near ${location}${specialties ? ` specializing in ${specialties.join(', ')}` : ''}`,
    source: 'ChatGPT-powered search'
  }
}

// Generate realistic review snippets
export function generateReviewSnippets(provider: ChatGPTProvider): string[] {
  const snippets = [
    `"${provider.name} did an excellent job with our solar installation. Professional team and great communication throughout the process."`,
    `"Very happy with our solar system from ${provider.businessName}. The savings on our electric bill are exactly as promised."`,
    `"Quality installation and competitive pricing. Would definitely recommend ${provider.name} to others considering solar."`,
    `"The team at ${provider.businessName} was knowledgeable and helped us choose the perfect system for our home."`,
    `"Great experience with ${provider.name}. Installation was completed on time and the system is performing excellently."`
  ]
  
  // Return random selection
  return snippets.slice(0, Math.floor(Math.random() * 3) + 2)
}

// Get provider details with enhanced information
export function getEnhancedProviderInfo(provider: ChatGPTProvider) {
  return {
    ...provider,
    reviewSnippets: generateReviewSnippets(provider),
    certifications: [
      'NABCEP Certified',
      'BBB Accredited',
      'State Licensed Contractor',
      'Solar Power World Top Contractor'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    warrantyInfo: {
      equipment: '25 years',
      workmanship: '10 years',
      performance: '25 years'
    },
    financingOptions: [
      'Solar Loans',
      'Solar Leasing',
      'Power Purchase Agreements (PPA)',
      'Cash Purchase Discounts'
    ],
    serviceAreas: [
      provider.city,
      `${provider.state} surrounding areas`,
      'Within 50 miles'
    ]
  }
}
