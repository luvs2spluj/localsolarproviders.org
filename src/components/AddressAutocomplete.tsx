"use client"

import { useEffect, useRef, useState } from "react"
import { searchAddresses } from "../lib/geocodingService"

interface AddressAutocompleteProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPick?: (addressData: {
    lat: number
    lng: number
    address: string
    name: string
  }) => void
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onPick, 
  onKeyPress, 
  placeholder, 
  className 
}: AddressAutocompleteProps) {
  const [q, setQ] = useState(value || "")
  const [hits, setHits] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const ctrl = useRef<AbortController | null>(null)
  const timeout = useRef<NodeJS.Timeout | null>(null)

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('addressSearchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.log('Could not load search history')
      }
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return
    
    const newHistory = [
      query.trim(),
      ...searchHistory.filter(item => item !== query.trim())
    ].slice(0, 10) // Keep only last 10 searches
    
    setSearchHistory(newHistory)
    localStorage.setItem('addressSearchHistory', JSON.stringify(newHistory))
  }

  useEffect(() => {
    if (!q) {
      setHits([])
      setOpen(false)
      return
    }

    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    
    timeout.current = setTimeout(async () => {
      await searchAddressesForAutocomplete(q)
    }, 1100) // debounce - decreased to 1.1 seconds

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [q])

  const searchAddressesForAutocomplete = async (query: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    
    // Abort previous request
    if (ctrl.current) {
      ctrl.current.abort()
    }
    
    ctrl.current = new AbortController()

    try {
      console.log('Searching addresses with Nominatim service:', query)
      
      // Use the new geocoding service with US focus
      const results = await searchAddresses(query, {
        limit: 8,
        country: 'US',
        language: 'en',
        focusPoint: { lat: 37.7749, lng: -122.4194 }, // San Francisco area
        bbox: [-125, 25, -66, 50] // US bounding box
      })

      console.log('Nominatim search results:', results)

      if (results && results.length > 0) {
        setHits(results)
        setOpen(true)
      } else {
        // If no results, show search history as suggestions
        const historyMatches = searchHistory.filter(item => 
          item.toLowerCase().includes(query.toLowerCase())
        )
        if (historyMatches.length > 0) {
          setHits(historyMatches.map(item => ({
            id: `history_${item}`,
            name: item,
            label: item,
            lat: null,
            lng: null,
            isHistory: true
          })))
          setOpen(true)
        } else {
          // Keep dropdown open even with no results, but show a message
          setHits([{
            id: 'no_results',
            name: 'No results found',
            label: 'No results found',
            lat: null,
            lng: null,
            isNoResults: true
          }])
          setOpen(true)
        }
      }

    } catch (error) {
      console.error('Nominatim search error:', error)
      // Don't show error to user, just show search history
      const historyMatches = searchHistory.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
      )
      if (historyMatches.length > 0) {
        setHits(historyMatches.map(item => ({
          id: `history_${item}`,
          name: item,
          label: item,
          lat: null,
          lng: null,
          isHistory: true
        })))
        setOpen(true)
      } else {
        // Keep dropdown open even with no results, but show a message
        setHits([{
          id: 'no_results',
          name: 'No results found',
          label: 'No results found',
          lat: null,
          lng: null,
          isNoResults: true
        }])
        setOpen(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const pick = (hit: any) => {
    console.log('Address picked:', hit)
    
    if (hit.isHistory) {
      // If it's from history, set the query and search again
      setQ(hit.name)
      searchAddressesForAutocomplete(hit.name)
      return
    }
    
    if (hit.lat && hit.lng && !isNaN(Number(hit.lat)) && !isNaN(Number(hit.lng))) {
      const addressData = {
        lat: Number(hit.lat),
        lng: Number(hit.lng),
        address: hit.label,
        name: hit.name
      }
      
      console.log('Calling onPick with:', addressData)
      
      // Save to search history
      saveSearchHistory(hit.label)
      
      // Update the input value with the selected address
      setQ(hit.label)
      
      // Keep dropdown open for continued typing
      // Don't clear hits or close dropdown
      
      // Mark as selected
      setIsSelected(true)
      
      // Call onPick after state updates
      onPick?.(addressData)
    } else {
      console.error('Invalid coordinates in hit:', hit)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQ(newValue)
    
    // Reset selected state when user starts typing
    if (isSelected) {
      setIsSelected(false)
      // Don't clear hits or close dropdown - let the search continue
      // Clear geocoding cache when starting a new search
      if (typeof window !== 'undefined' && (window as any).clearGeocodingCache) {
        (window as any).clearGeocodingCache()
      }
    }
    
    onChange?.(e)
  }

  const handleInputFocus = () => {
    // Show search history when focusing on empty input
    if (!q && searchHistory.length > 0) {
      setHits(searchHistory.map(item => ({
        id: `history_${item}`,
        name: item,
        label: item,
        lat: null,
        lng: null,
        isHistory: true
      })))
      setOpen(true)
    } else if (q && hits.length > 0 && !isSelected) {
      setOpen(true)
    }
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={handleInputChange}
        onKeyPress={onKeyPress}
        onFocus={handleInputFocus}
        onBlur={() => {
          // Close dropdown immediately on blur, but allow time for click events
          setTimeout(() => {
            setOpen(false)
          }, 150)
        }}
        placeholder={placeholder || "Search address or place"}
        className={`${className || "w-full rounded border px-3 py-2"} ${
          isSelected ? "border-green-500 bg-green-50" : ""
        }`}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      
      {isSelected && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Address selected - click the green button to change
        </div>
      )}
      
      {/* US Address Warning */}
      {isSelected && hits.length > 0 && hits[0].address && 
       !hits[0].address.country?.toLowerCase().includes('united states') && (
        <div className="mt-1 text-xs text-orange-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Non-US address detected. Solar data may be limited.
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {isSelected && !isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <button
            onClick={() => {
              setQ("")
              setHits([])
              setOpen(false)
              setIsSelected(false)
              // Clear the parent's address state
              onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)
            }}
            className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            title="Clear selection"
          >
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded border bg-white shadow-lg">
          {hits.map(h => (
            <li
              key={h.id}
              className={`px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                h.isHistory ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : 
                h.isNoResults ? 'bg-gray-50 text-gray-500 cursor-default' :
                'cursor-pointer hover:bg-gray-100'
              }`}
              onMouseDown={() => !h.isNoResults && pick(h)}
            >
              <div className="font-medium text-gray-900">
                {h.isHistory ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {h.name}
                  </span>
                ) : h.isNoResults ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {h.name}
                  </span>
                ) : (
                  h.name
                )}
              </div>
              {!h.isHistory && !h.isNoResults && (
                <>
                  <div className="text-sm text-gray-600">{h.label}</div>
                  {h.address && (
                    <div className="text-xs text-gray-400 mt-1">
                      {[
                        h.address.house_number,
                        h.address.road,
                        h.address.city,
                        h.address.state
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
