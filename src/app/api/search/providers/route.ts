import { NextRequest, NextResponse } from 'next/server'
import { searchIntegrationService } from '@/lib/search-integration'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseInt(searchParams.get('radius') || '50')
    const limit = parseInt(searchParams.get('limit') || '50')
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

    let result

    // If coordinates are provided, use them directly
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)
      
      result = await searchIntegrationService.searchByCoordinates(
        latitude,
        longitude,
        {
          radius,
          limit,
          minRating,
          verifiedOnly
        }
      )
    } 
    // If address is provided, geocode it
    else if (address) {
      result = await searchIntegrationService.searchByAddress(
        address,
        {
          radius,
          limit,
          minRating,
          verifiedOnly
        }
      )
    } 
    else {
      return NextResponse.json(
        { error: 'Either address or lat/lng coordinates must be provided' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Search providers error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search for providers' },
      { status: 500 }
    )
  }
}
