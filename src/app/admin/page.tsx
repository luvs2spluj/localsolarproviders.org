'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, RefreshCw, Download, Upload, MapPin, Globe, Phone } from 'lucide-react'

interface Installer {
  id: string
  name: string
  city?: string
  state?: string
  website?: string
  phone?: string
  lat: number
  lon: number
  lastScannedAt?: string
  specialties: Array<{
    specialty: {
      slug: string
      label: string
    }
  }>
  externalLinks: Array<{
    kind: string
    url: string
  }>
}

interface ScanLog {
  id: string
  source: string
  status: string
  message?: string
  createdAt: string
  installer?: {
    name: string
  }
}

export default function AdminPage() {
  const [installers, setInstallers] = useState<Installer[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchRadius, setSearchRadius] = useState(25000)
  
  // Discovery form
  const [discoveryLat, setDiscoveryLat] = useState('')
  const [discoveryLon, setDiscoveryLon] = useState('')
  const [discoveryLocation, setDiscoveryLocation] = useState('')
  
  const [selectedInstallers, setSelectedInstallers] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadInstallers()
    loadScanLogs()
  }, [])

  const loadInstallers = async () => {
    try {
      const response = await fetch('/api/providers')
      const data = await response.json()
      if (response.ok) {
        setInstallers(data.providers)
      }
    } catch (error) {
      console.error('Error loading installers:', error)
    }
  }

  const loadScanLogs = async () => {
    try {
      const response = await fetch('/api/admin/scan-logs')
      if (response.ok) {
        const data = await response.json()
        setScanLogs(data.logs)
      }
    } catch (error) {
      console.error('Error loading scan logs:', error)
    }
  }

  const handleDiscovery = async () => {
    if ((!discoveryLat || !discoveryLon) && !discoveryLocation) {
      alert('Please provide either coordinates or a location name')
      return
    }

    setLoading(true)
    try {
      const body: any = { radiusMeters: searchRadius }
      
      if (discoveryLocation) {
        body.location = discoveryLocation
      } else {
        body.lat = parseFloat(discoveryLat)
        body.lon = parseFloat(discoveryLon)
      }

      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Discovery completed! Found ${data.discovered} candidates, processed ${data.processed} installers.`)
        loadInstallers()
        loadScanLogs()
      } else {
        alert(`Discovery failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Discovery error:', error)
      alert('Discovery failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichSelected = async () => {
    if (selectedInstallers.size === 0) {
      alert('Please select installers to enrich')
      return
    }

    setLoading(true)
    const results = []
    
    for (const installerId of Array.from(selectedInstallers)) {
      try {
        const response = await fetch(`/api/enrich/${installerId}`, {
          method: 'POST'
        })
        const data = await response.json()
        results.push(`${data.installer?.name || installerId}: ${data.success ? 'Success' : data.error}`)
      } catch (error) {
        results.push(`${installerId}: Error - ${error}`)
      }
    }
    
    alert(`Enrichment completed:\n${results.join('\n')}`)
    loadInstallers()
    loadScanLogs()
    setSelectedInstallers(new Set())
    setLoading(false)
  }

  const handleSelectAll = () => {
    if (selectedInstallers.size === installers.length) {
      setSelectedInstallers(new Set())
    } else {
      setSelectedInstallers(new Set(installers.map(i => i.id)))
    }
  }

  const handleSelectInstaller = (installerId: string) => {
    const newSelected = new Set(selectedInstallers)
    if (newSelected.has(installerId)) {
      newSelected.delete(installerId)
    } else {
      newSelected.add(installerId)
    }
    setSelectedInstallers(newSelected)
  }

  const handleSeedData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`Success! ${data.message}`)
        loadInstallers()
        loadScanLogs()
      } else {
        alert(`Seeding failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Seeding error:', error)
      alert('Failed to seed sample data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Solar Providers Admin</h1>

        {/* Discovery Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Discover New Installers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name (e.g., "San Francisco, CA")
              </label>
              <input
                type="text"
                value={discoveryLocation}
                onChange={(e) => setDiscoveryLocation(e.target.value)}
                placeholder="City, State or Address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OR Latitude</label>
              <input
                type="number"
                value={discoveryLat}
                onChange={(e) => setDiscoveryLat(e.target.value)}
                placeholder="37.7749"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                value={discoveryLon}
                onChange={(e) => setDiscoveryLon(e.target.value)}
                placeholder="-122.4194"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius (meters)
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={25000}>25 km (default)</option>
                <option value={50000}>50 km (max)</option>
              </select>
            </div>
            
            <div className="flex-1 flex items-end">
              <button
                onClick={handleDiscovery}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Discovering...' : 'Discover Installers'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Uses OpenStreetMap Overpass API to find solar installers. Respects fair use policies (max 50km radius).
            </p>
            
            <button
              onClick={handleSeedData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Seed Sample Data
            </button>
          </div>
        </div>

        {/* Installers Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Installers ({installers.length})
            </h2>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {selectedInstallers.size === installers.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={handleEnrichSelected}
                disabled={loading || selectedInstallers.size === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Enrich Selected ({selectedInstallers.size})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInstallers.size === installers.length && installers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Installer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Links
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Scanned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {installers.map((installer) => (
                  <tr key={installer.id} className={selectedInstallers.has(installer.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInstallers.has(installer.id)}
                        onChange={() => handleSelectInstaller(installer.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{installer.name}</div>
                        {installer.website && (
                          <a
                            href={installer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        )}
                        {installer.phone && (
                          <a
                            href={`tel:${installer.phone}`}
                            className="text-green-600 hover:text-green-800 text-xs flex items-center"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            {installer.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {[installer.city, installer.state].filter(Boolean).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {installer.lat.toFixed(4)}, {installer.lon.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {installer.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {specialty.specialty.label}
                          </span>
                        ))}
                        {installer.specialties.length === 0 && (
                          <span className="text-gray-400 text-xs">No specialties detected</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        {installer.externalLinks.length} links
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {installer.lastScannedAt 
                        ? new Date(installer.lastScannedAt).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scan Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md text-sm ${
                  log.status === 'OK' 
                    ? 'bg-green-50 text-green-800' 
                    : log.status === 'ERROR'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{log.source}</span>
                    {log.installer && <span className="ml-2">• {log.installer.name}</span>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                {log.message && (
                  <div className="mt-1 text-xs">{log.message}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
