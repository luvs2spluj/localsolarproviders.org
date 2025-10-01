'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, MapPin, Loader, Crosshair } from 'lucide-react'

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
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentRequestRef = useRef<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (address?: string) => {
    const searchAddress = address || searchValue
    if (!searchAddress.trim()) return

    setIsSearching(true)
    setError(null)
    setShowSuggestions(false)

    try {
      // Search for providers using the new API endpoint
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

  const fetchSuggestions = useCallback(async (query: string) => {
    if (currentRequestRef.current !== query) return // Prevent stale requests
    
    try {
      // Add more specific search parameters for better results
      const searchParams = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        limit: '8',
        q: query,
        countrycodes: 'us', // Focus on US results
        'accept-language': 'en'
      })
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams}`,
        {
          headers: {
            'User-Agent': 'LocalSolarProviders/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      
      const results = await response.json()
      
      // Filter and prioritize results
      const filteredResults = results.filter((result: any) => {
        const type = result.type
        const category = result.category
        const displayName = result.display_name.toLowerCase()
        
        // Prioritize US locations and relevant place types
        return (
          (category === 'place' || 
           category === 'boundary' ||
           type === 'city' ||
           type === 'town' ||
           type === 'village' ||
           type === 'administrative' ||
           type === 'suburb' ||
           type === 'house' ||
           type === 'postcode') &&
          (displayName.includes('united states') || displayName.includes(', us'))
        )
      })
      
      // Sort by relevance (exact matches first, then by type priority)
      const sortedResults = filteredResults.sort((a: any, b: any) => {
        const aName = a.display_name.toLowerCase()
        const bName = b.display_name.toLowerCase()
        const queryLower = query.toLowerCase()
        
        // Exact city/state matches first
        if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1
        if (!aName.startsWith(queryLower) && bName.startsWith(queryLower)) return 1
        
        // Prefer cities over other types
        const aIsCity = a.type === 'city' || a.category === 'place'
        const bIsCity = b.type === 'city' || b.category === 'place'
        if (aIsCity && !bIsCity) return -1
        if (!aIsCity && bIsCity) return 1
        
        return 0
      })
      
      // Only update if this is still the current request
      if (currentRequestRef.current === query) {
        setSuggestions(sortedResults.slice(0, 5))
        setShowSuggestions(sortedResults.length > 0)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      if (currentRequestRef.current === query) {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }
  }, [])

  const handleInputChange = (value: string) => {
    setSearchValue(value)
    setError(null)
    currentRequestRef.current = value

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Only show suggestions for longer queries to avoid irrelevant results
    if (value.length >= 4) {
      // Debounce the API call
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, 300) // 300ms debounce
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    const address = suggestion.display_name
    setSearchValue(address)
    setShowSuggestions(false)
    handleSearch(address)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'LocalSolarProviders/1.0'
              }
            }
          )
          
          const data = await response.json()
          const address = data.display_name || `${latitude}, ${longitude}`
          
          setSearchValue(address)
          
          // Perform search with coordinates
          const location: SearchLocation = {
            address,
            coordinates: { lat: latitude, lon: longitude },
            city: data.address?.city || data.address?.town,
            state: data.address?.state,
            country: data.address?.country
          }
          
            // Search for providers near this location using the providers API
            const searchResponse = await fetch(`/api/search/providers?address=${encodeURIComponent(address)}&radius=50`)
            const searchData = await searchResponse.json()

            if (searchResponse.ok) {
              onSearch(location, searchData.providers)
            } else {
              setError('Failed to find providers near your location')
            }
          
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          setError('Failed to get your address')
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Unable to get your location. Please check your browser permissions.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Handle click outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full pl-12 pr-32 py-4 text-lg text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
          disabled={isSearching || isLocating}
        />
        
        {/* Find My Location Button */}
        <button
          onClick={handleFindMyLocation}
          disabled={isSearching || isLocating}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSearching ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Address Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {suggestion.display_name.split(',')[0]}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

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
