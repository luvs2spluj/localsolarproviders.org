'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import AddressSearch from './AddressSearch'
import { useUserContext } from './UserProvider'

interface SearchLocation {
  address: string
  coordinates: {
    lat: number
    lon: number
  }
  city?: string
  state?: string
}

export default function HomePageSearch() {
  const { user } = useUser()
  const { saveInstallersList, getSavedInstallers } = useUserContext()
  const [providers, setProviders] = useState<any[]>([])
  const [location, setLocation] = useState<SearchLocation | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (searchLocation: SearchLocation, searchProviders: any[]) => {
    setLocation(searchLocation)
    setProviders(searchProviders)
    setShowResults(true)
  }

  const handleSaveList = () => {
    if (location && providers.length > 0) {
      saveInstallersList(location.address, providers)
      alert(`Saved ${providers.length} providers for ${location.address}`)
    }
  }

  const isListSaved = () => {
    if (!location) return false
    const saved = getSavedInstallers(location.address)
    return saved.length > 0
  }

  return (
    <div className="w-full">
      <AddressSearch 
        onSearch={handleSearch}
        placeholder="Enter your address, city, or zip code to find vetted local solar providers"
      />
      
      {showResults && location && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Vetted Local Solar Providers near "{location.address}"
            </h2>
            {user && providers.length > 0 && (
              <button
                onClick={handleSaveList}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  isListSaved() 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {isListSaved() ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span>Save List</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <div 
                  key={provider.id} 
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    if (provider.website) {
                      window.open(provider.website, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {provider.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{provider.location}</p>
                  {provider.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{provider.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {provider.specialties?.slice(0, 3).map((specialty: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-3">
                    {provider.website && (
                      <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Visit Website →
                      </span>
                    )}
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Call {provider.phone}
                      </a>
                    )}
                  </div>
                  {provider.source && (
                    <div className="mt-2 text-xs text-gray-500">
                      Source: {provider.source}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vetted providers found in our database
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any vetted solar installers for "{location?.address}". 
                  This could be because:
                </p>
                <ul className="text-gray-500 text-sm text-left max-w-md mx-auto space-y-1">
                  <li>• The location is too remote</li>
                  <li>• No solar providers are registered in this area</li>
                  <li>• Our search didn't return any results</li>
                </ul>
                <p className="text-gray-500 text-sm mt-4">
                  Try searching for a nearby city or check back later as we update our database.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
