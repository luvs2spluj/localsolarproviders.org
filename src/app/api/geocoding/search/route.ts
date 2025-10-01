import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') || '8'
    const country = searchParams.get('country') || 'US'

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Build Nominatim URL
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', limit)
    url.searchParams.set('countrycodes', country.toLowerCase())
    url.searchParams.set('dedupe', '1')
    url.searchParams.set('language', 'en')
    
    // Add US bounding box for better results
    url.searchParams.set('viewbox', '-125,25,-66,50')
    url.searchParams.set('bounded', '1')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LocalSolarProviders/1.0 (contact@localsolarproviders.org)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return NextResponse.json([])
    }

    // Transform results
    const results = data.map((item: any, index: number) => ({
      id: `nominatim_${item.place_id || index}`,
      name: item.name || item.display_name.split(',')[0] || query,
      label: item.display_name || item.name || query,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address ? {
        house_number: item.address.house_number,
        road: item.address.road,
        city: item.address.city || item.address.town || item.address.village,
        state: item.address.state,
        postcode: item.address.postcode,
        country: item.address.country
      } : undefined,
      importance: item.importance,
      place_rank: item.place_rank,
      category: item.category,
      type: item.type
    }))

    return NextResponse.json(results)

  } catch (error) {
    console.error('Geocoding search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding failed' },
      { status: 500 }
    )
  }
}
