'use client'

import { useState } from 'react'
import { Search, RefreshCw, MapPin, ExternalLink, Clock, Zap } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  rank: number
  engine: 'BRAVE' | 'GOOGLE'
  cached: boolean
  fetchedAt?: string
}

interface SearchResponse {
  success: boolean
  results: SearchResult[]
  cached: boolean
  engine: 'BRAVE' | 'GOOGLE'
  query: string
  location: string
  lastFetched: string
  message: string
  error?: string
}

export default function SearchPage() {
  const [location, setLocation] = useState('San Jose, CA')
  const [engine, setEngine] = useState<'BRAVE' | 'GOOGLE'>('BRAVE')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [lastSearch, setLastSearch] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (force = false) => {
    if (!location.trim()) {
      setError('Please enter a location')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: location.trim(),
          engine,
          force
        })
      })

      const data: SearchResponse = await response.json()

      if (data.success) {
        setResults(data.results)
        setLastSearch(data)
      } else {
        setError(data.error || 'Search failed')
        setResults([])
      }

    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    handleSearch(true) // Force refresh
  }

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Solar Installer Search
          </h1>
          <p className="text-lg text-gray-600">
            Find solar installers using official search APIs with caching
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Location Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city, state (e.g., San Jose, CA)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Engine Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Engine
              </label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as 'BRAVE' | 'GOOGLE')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BRAVE">Brave Search (Free)</option>
                <option value="GOOGLE">Google CSE (100/day)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              Search
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading || !lastSearch}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Status */}
        {lastSearch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  <strong>{lastSearch.engine}</strong>: {lastSearch.message}
                </span>
              </div>
              <div className="flex items-center text-xs text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(lastSearch.lastFetched).toLocaleString()}
                {lastSearch.cached && <span className="ml-2 bg-blue-100 px-2 py-1 rounded">Cached</span>}
              </div>
            </div>
            {lastSearch.engine === 'GOOGLE' && (
              <div className="mt-2 text-xs text-gray-600">
                <em>Powered by Google</em> - Custom Search JSON API
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results ({results.length})
            </h2>
            
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  {/* Result Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {result.title}
                      </a>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {getHostname(result.url)}
                        <span className="mx-2">•</span>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {result.engine}
                        </span>
                        {result.cached && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            Cached
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 ml-4">
                      #{result.rank}
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-gray-700 leading-relaxed">
                    {result.snippet}
                  </p>

                  {/* Cached timestamp */}
                  {result.fetchedAt && (
                    <div className="mt-3 text-xs text-gray-500">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Fetched: {new Date(result.fetchedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No searches yet</h3>
            <p className="text-gray-600">Enter a location and click Search to find solar installers</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
