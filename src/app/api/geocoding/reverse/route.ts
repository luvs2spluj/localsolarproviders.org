import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Both "lat" and "lng" parameters are required' },
        { status: 400 }
      )
    }

    // Build Nominatim reverse geocoding URL
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lng)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LocalSolarProviders/1.0 (contact@localsolarproviders.org)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocoding error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.lat || !data.lon) {
      return NextResponse.json(null)
    }

    // Transform result
    const result = {
      id: `reverse_${data.place_id}`,
      name: data.name || data.display_name.split(',')[0],
      label: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      address: data.address ? {
        house_number: data.address.house_number,
        road: data.address.road,
        city: data.address.city || data.address.town || data.address.village,
        state: data.address.state,
        postcode: data.address.postcode,
        country: data.address.country
      } : undefined,
      importance: data.importance,
      place_rank: data.place_rank,
      category: data.category,
      type: data.type
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reverse geocoding failed' },
      { status: 500 }
    )
  }
}
