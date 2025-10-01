import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseInt(searchParams.get('radius') || '50')

    // Mock location data
    const location = {
      address: address || 'Test Location',
      coordinates: { 
        lat: lat ? parseFloat(lat) : 37.7749, 
        lng: lng ? parseFloat(lng) : -122.4194 
      },
      city: 'San Francisco',
      state: 'CA',
      country: 'US'
    }

    // Mock provider data
    const providers = [
      {
        id: '1',
        name: 'SunPower Solar Solutions',
        business_name: 'SunPower Solar Solutions LLC',
        location: 'San Francisco, CA',
        address: '123 Solar Street, San Francisco, CA 94102',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        phone: '(555) 123-4567',
        email: 'info@sunpower-solar.com',
        website: 'https://sunpower-solar.com',
        license_number: 'C-46-123456',
        license_state: 'CA',
        license_type: 'C-46',
        specialties: ['Residential Solar', 'Commercial Solar', 'Battery Storage'],
        brands_worked_with: ['SunPower', 'Tesla', 'LG'],
        estimated_installed_kw: 1500.5,
        overall_rating: 4.8,
        total_reviews: 127,
        is_verified: true,
        is_active: true,
        distance: 2.3
      },
      {
        id: '2',
        name: 'Green Energy Installers',
        business_name: 'Green Energy Installers Inc',
        location: 'Oakland, CA',
        address: '456 Green Ave, Oakland, CA 94601',
        city: 'Oakland',
        state: 'CA',
        zip_code: '94601',
        phone: '(555) 987-6543',
        email: 'contact@greenenergy.com',
        website: 'https://greenenergy.com',
        license_number: 'C-46-789012',
        license_state: 'CA',
        license_type: 'C-46',
        specialties: ['Residential Solar', 'Solar Maintenance'],
        brands_worked_with: ['Panasonic', 'Enphase'],
        estimated_installed_kw: 850.2,
        overall_rating: 4.6,
        total_reviews: 89,
        is_verified: true,
        is_active: true,
        distance: 8.7
      },
      {
        id: '3',
        name: 'EcoSolar Systems',
        business_name: 'EcoSolar Systems LLC',
        location: 'Berkeley, CA',
        address: '789 Eco Way, Berkeley, CA 94704',
        city: 'Berkeley',
        state: 'CA',
        zip_code: '94704',
        phone: '(555) 456-7890',
        email: 'hello@ecosolar.com',
        website: 'https://ecosolar.com',
        license_number: 'C-46-345678',
        license_state: 'CA',
        license_type: 'C-46',
        specialties: ['Residential Solar', 'Commercial Solar', 'EV Charging'],
        brands_worked_with: ['SolarEdge', 'Tesla', 'ChargePoint'],
        estimated_installed_kw: 2100.8,
        overall_rating: 4.9,
        total_reviews: 203,
        is_verified: true,
        is_active: true,
        distance: 12.1
      }
    ]

    return NextResponse.json({
      location,
      providers,
      total: providers.length,
      radius
    })

  } catch (error) {
    console.error('Simple search providers error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search for providers' },
      { status: 500 }
    )
  }
}
