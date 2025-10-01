'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Star, Phone, Globe } from 'lucide-react'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

interface Provider {
  id: string
  name: string
  businessName?: string
  location: string
  address?: string
  phone?: string
  website?: string
  overallRating: string
  totalReviews: number
  distance: number
  coordinates?: { lat: number, lon: number }
  source?: string
}

interface ProvidersMapProps {
  providers: Provider[]
  userLocation?: {
    lat: number
    lon: number
    address: string
  }
  radius?: number
  onProviderSelect?: (provider: Provider) => void
}

export default function ProvidersMap({ 
  providers, 
  userLocation, 
  radius = 50,
  onProviderSelect 
}: ProvidersMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  useEffect(() => {
    // Load Leaflet CSS
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css')
      setMapLoaded(true)
    }
  }, [])

  if (!mapLoaded || !userLocation) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider)
    if (onProviderSelect) {
      onProviderSelect(provider)
    }
  }

  const renderStars = (rating: string) => {
    const ratingNum = parseFloat(rating) || 0
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= ratingNum
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">
          {ratingNum.toFixed(1)}
        </span>
      </div>
    )
  }

  // Create custom icons
  const createCustomIcon = (color: string, isUser: boolean = false) => {
    if (typeof window === 'undefined') return null
    
    try {
      const L = require('leaflet')
      
      return new L.DivIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isUser ? '🏠' : '☀️'}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
    } catch (error) {
      console.error('Error creating custom icon:', error)
      return null
    }
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[userLocation.lat, userLocation.lon]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Search radius circle */}
        <Circle
          center={[userLocation.lat, userLocation.lon]}
          radius={radius * 1609.34} // Convert miles to meters
          fillColor="yellow"
          fillOpacity={0.1}
          color="orange"
          weight={2}
        />
        
        {/* User location marker */}
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={createCustomIcon('#ef4444', true)}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">Your Location</h3>
              <p className="text-xs text-gray-600">{userLocation.address}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Provider markers */}
        {providers.map((provider) => {
          if (!provider.coordinates) return null
          
          const markerColor = provider.source === 'google_search' ? '#10b981' : '#3b82f6'
          
          return (
            <Marker
              key={provider.id}
              position={[provider.coordinates.lat, provider.coordinates.lon]}
              icon={createCustomIcon(markerColor)}
              eventHandlers={{
                click: () => handleProviderClick(provider)
              }}
            >
              <Popup>
                <div className="p-3 min-w-64">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm pr-2">
                      {provider.businessName || provider.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      provider.source === 'google_search' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {provider.source === 'google_search' ? 'Live' : 'Verified'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    {renderStars(provider.overallRating)}
                    <p className="text-xs text-gray-600 mt-1">
                      {provider.totalReviews} reviews
                    </p>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{provider.distance} miles away</span>
                    </div>
                    
                    {provider.phone && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        <a href={`tel:${provider.phone}`} className="hover:text-blue-600">
                          {provider.phone}
                        </a>
                      </div>
                    )}
                    
                    {provider.website && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Globe className="h-3 w-3 mr-1" />
                        <a 
                          href={provider.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleProviderClick(provider)}
                    className="w-full bg-yellow-500 text-white text-xs py-2 px-3 rounded hover:bg-yellow-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
