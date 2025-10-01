import { NextRequest, NextResponse } from 'next/server'
import { searchProvidersWithChatGPT, getEnhancedProviderInfo } from '@/lib/chatgpt-search'
import { geocodeAddress } from '@/lib/overpass'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || searchParams.get('address')
    const specialties = searchParams.get('specialties')?.split(',').filter(Boolean)
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    console.log(`ChatGPT search for: ${location}`)
    
    // Search using ChatGPT-style database
    const searchResult = await searchProvidersWithChatGPT(location, specialties, radius)
    
    // Geocode the location for map display
    let coordinates = null
    try {
      coordinates = await geocodeAddress(location)
    } catch (error) {
      console.warn('Geocoding failed:', error)
    }
    
    // Transform providers to match our interface
    const transformedProviders = searchResult.providers.map((provider, index) => ({
      id: `chatgpt-${index}`,
      name: provider.name,
      businessName: provider.businessName,
      location: provider.location,
      address: provider.address,
      city: provider.city,
      state: provider.state,
      zipCode: provider.zipCode,
      phone: provider.phone,
      website: provider.website,
      overallRating: provider.overallRating,
      totalReviews: provider.totalReviews,
      totalLeads: 0,
      specialties: provider.specialties,
      isVerified: provider.isVerified,
      isActive: true,
      coordinates: provider.coordinates || coordinates,
      source: 'chatgpt',
      description: provider.description,
      yearEstablished: provider.yearEstablished,
      licenseNumber: provider.licenseNumber,
      // Generate external links
      externalLinks: [
        {
          kind: 'GOOGLE',
          url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.city + ' ' + provider.state)}`
        },
        {
          kind: 'YELP', 
          url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(provider.name)}&find_loc=${encodeURIComponent(provider.city + ', ' + provider.state)}`
        },
        {
          kind: 'BBB',
          url: `https://www.bbb.org/search?find_text=${encodeURIComponent(provider.name)}&find_loc=${encodeURIComponent(provider.city + ', ' + provider.state)}`
        }
      ]
    }))

    return NextResponse.json({
      success: true,
      providers: transformedProviders,
      searchQuery: searchResult.searchQuery,
      source: searchResult.source,
      location: {
        address: location,
        coordinates: coordinates || { lat: 0, lon: 0 },
        city: location.split(',')[0],
        state: location.split(',')[1]?.trim()
      },
      pagination: {
        limit: 20,
        offset: 0,
        hasMore: false
      }
    })

  } catch (error) {
    console.error('ChatGPT search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
