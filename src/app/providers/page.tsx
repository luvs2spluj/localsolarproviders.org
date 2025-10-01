'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, Star } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProviderCard from '@/components/ProviderCard'

interface Provider {
  id: string
  name: string
  businessName?: string | null
  location: string
  overallRating: string | null
  totalReviews: number | null
  specialties: string[]
  averageCostPerWatt: string | null
  phone?: string | null
  website?: string | null
  isVerified: boolean | null
  yearsInBusiness?: number | null
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLocation, setSearchLocation] = useState('')
  const [minRating, setMinRating] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchLocation) params.append('location', searchLocation)
      if (minRating) params.append('rating', minRating)

      const response = await fetch(`/api/providers?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setProviders(data.providers)
      } else {
        console.error('Error fetching providers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProviders()
  }

  const resetFilters = () => {
    setSearchLocation('')
    setMinRating('')
    fetchProviders()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Search and Filter Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by location (city, state, or zip code)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Solar Providers
            {searchLocation && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                in {searchLocation}
              </span>
            )}
          </h1>
          <div className="text-sm text-gray-600">
            {providers.length} providers found
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or location.
            </p>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
