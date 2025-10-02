'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, MapPin, Loader, Crosshair } from 'lucide-react'
import AddressAutocomplete from './AddressAutocomplete'

interface SearchLocation {
  address: string
  coordinates: {
    lat: number
    lon: number
  }
  city?: string
  state?: string
  country?: string
}

interface AddressSearchProps {
  onSearch: (location: SearchLocation, providers: any[]) => void
  placeholder?: string
}

export default function AddressSearch({ onSearch, placeholder = "Enter your address or zip code" }: AddressSearchProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<{
    lat: number
    lng: number
    address: string
    name: string
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (address?: string) => {
    const searchAddress = address || searchValue
    if (!searchAddress.trim()) return

    setIsSearching(true)
    setError(null)

            try {
              // Search for providers using the real Supabase API endpoint
              const response = await fetch(`/api/search/providers?address=${encodeURIComponent(searchAddress)}&radius=50`)
              const data = await response.json()

              if (response.ok) {
                onSearch(data.location, data.providers)
                setSearchValue(searchAddress)
              } else {
                setError(data.error || 'Failed to search for providers')
              }
            } catch (error) {
              console.error('Search error:', error)
              setError('Failed to search for providers')
            } finally {
              setIsSearching(false)
            }
  }

  const handleAddressPick = (addressData: {
    lat: number
    lng: number
    address: string
    name: string
  }) => {
    setSelectedAddress(addressData)
    setSearchValue(addressData.address)
    
    // Create SearchLocation object
    const location: SearchLocation = {
      address: addressData.address,
      coordinates: { lat: addressData.lat, lon: addressData.lng },
      city: addressData.address.split(',')[1]?.trim(),
      state: addressData.address.split(',')[2]?.trim(),
      country: 'US'
    }
    
    // Automatically search for providers when address is selected
    handleSearchWithLocation(location)
  }

  const handleSearchWithLocation = async (location: SearchLocation) => {
    setIsSearching(true)
    setError(null)

            try {
              // Search for providers using coordinates (real Supabase endpoint)
              const response = await fetch(`/api/search/providers?lat=${location.coordinates.lat}&lng=${location.coordinates.lon}&radius=50`)
              const data = await response.json()

              if (response.ok) {
                onSearch(location, data.providers)
              } else {
                setError(data.error || 'Failed to search for providers')
              }
            } catch (error) {
              console.error('Search error:', error)
              setError('Failed to search for providers')
            } finally {
              setIsSearching(false)
            }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    setError(null)
    
    // Clear selected address when user starts typing
    if (selectedAddress) {
      setSelectedAddress(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleFindMyLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLocating(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      
      // Use the geocoding service for reverse geocoding
      const { geocodingService } = await import('../lib/geocodingService')
      const result = await geocodingService.reverseGeocode(latitude, longitude)
      
      if (result) {
        const address = result.label
        setSearchValue(address)
        setSelectedAddress({
          lat: result.lat,
          lng: result.lng,
          address: result.label,
          name: result.name
        })
        
        // Perform search with coordinates
        const location: SearchLocation = {
          address,
          coordinates: { lat: result.lat, lon: result.lng },
          city: result.address?.city,
          state: result.address?.state,
          country: result.address?.country || 'US'
        }
        
        await handleSearchWithLocation(location)
      } else {
        setError('Failed to get your address')
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      setError('Unable to get your location. Please check your browser permissions.')
    } finally {
      setIsLocating(false)
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Handle any cleanup if needed
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input with Autocomplete */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
        <AddressAutocomplete
          value={searchValue}
          onChange={handleInputChange}
          onPick={handleAddressPick}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full pl-12 pr-32 py-4 text-lg text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
        />
        
        {/* Find My Location Button */}
        <button
          onClick={handleFindMyLocation}
          disabled={isSearching || isLocating}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center z-10"
          title="Find my location"
        >
          {isLocating ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
        </button>
        
        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || isLocating || !searchValue.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center z-10"
        >
          {isSearching ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search Tips */}
      <div className="mt-3 text-center">
        <p className="text-gray-600 text-sm">
          Try searching for: "123 Main St, City, State" or "90210" or "New York, NY"
        </p>
      </div>
    </div>
  )
}
