'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Star, MapPin, Phone, Globe, Mail, Award, 
  Calendar, Users, DollarSign, Clock, 
  MessageSquare, ThumbsUp 
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
  businessName?: string | null
  location: string
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  licenseNumber?: string | null
  yearsInBusiness?: number | null
  employeeCount?: number | null
  serviceArea?: string | null
  specialties: string[]
  brandsWorkedWith: string[]
  averageCostPerWatt?: string | null
  averageTurnaroundDays?: number | null
  overallRating: string | null
  totalReviews: number | null
  totalLeads: number | null
  isVerified: boolean | null
  isActive: boolean | null
  verificationDate?: string | null
  createdAt: string
  updatedAt: string
}

interface Review {
  id: string
  rating: number
  title?: string | null
  content: string
  projectType?: string | null
  systemSize?: string | null
  totalCost?: string | null
  costPerWatt?: string | null
  installationDate?: string | null
  communicationRating?: number | null
  timelinessRating?: number | null
  qualityRating?: number | null
  valueRating?: number | null
  isVerified: boolean | null
  createdAt: string
}

export default function ProviderProfilePage() {
  const params = useParams()
  const providerId = params.id as string
  
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails()
    }
  }, [providerId])

  const fetchProviderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/providers/${providerId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProvider(data.provider)
        setReviews(data.reviews)
      } else {
        setError(data.error || 'Failed to load provider details')
      }
    } catch (error) {
      console.error('Error fetching provider details:', error)
      setError('Failed to load provider details')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The provider you are looking for does not exist.'}</p>
            <Link
              href="/providers"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Providers
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const rating = provider.overallRating ? parseFloat(provider.overallRating) : 0
  const reviewCount = provider.totalReviews || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Provider Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-3">
                  {provider.businessName || provider.name}
                </h1>
                {provider.isVerified && (
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <Award className="h-4 w-4 mr-1" />
                    Verified
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{provider.location}</span>
                {provider.licenseNumber && (
                  <>
                    <span className="mx-2">•</span>
                    <span>License: {provider.licenseNumber}</span>
                  </>
                )}
              </div>

              <div className="flex items-center mb-4">
                {renderStars(rating)}
                <span className="ml-2 text-lg font-medium text-gray-900">
                  {rating.toFixed(1)}
                </span>
                <span className="ml-1 text-gray-600">
                  ({reviewCount} reviews)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
              <Link
                href={`/providers/${provider.id}/quote`}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg text-center font-semibold hover:bg-yellow-600 transition-colors"
              >
                Get Free Quote
              </Link>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-50 transition-colors"
                >
                  Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Provider</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {provider.yearsInBusiness && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="font-medium">Years in Business</div>
                      <div className="text-gray-600">{provider.yearsInBusiness} years</div>
                    </div>
                  </div>
                )}

                {provider.employeeCount && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="font-medium">Team Size</div>
                      <div className="text-gray-600">{provider.employeeCount} employees</div>
                    </div>
                  </div>
                )}

                {provider.averageCostPerWatt && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="font-medium">Average Cost</div>
                      <div className="text-gray-600">${provider.averageCostPerWatt}/watt</div>
                    </div>
                  </div>
                )}

                {provider.averageTurnaroundDays && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="font-medium">Average Turnaround</div>
                      <div className="text-gray-600">{provider.averageTurnaroundDays} days</div>
                    </div>
                  </div>
                )}
              </div>

              {provider.serviceArea && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Service Area</h3>
                  <p className="text-gray-600">{provider.serviceArea}</p>
                </div>
              )}
            </div>

            {/* Specialties */}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Brands */}
            {provider.brandsWorkedWith && provider.brandsWorkedWith.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Brands We Work With</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.brandsWorkedWith.map((brand, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Reviews</h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                          {review.isVerified && (
                            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      )}
                      
                      <p className="text-gray-600 mb-3">{review.content}</p>
                      
                      {(review.projectType || review.systemSize) && (
                        <div className="text-sm text-gray-500 space-x-4">
                          {review.projectType && <span>Project: {review.projectType}</span>}
                          {review.systemSize && <span>System: {review.systemSize} kW</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <Link
                      href={`/providers/${provider.id}/reviews`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all {reviewCount} reviews →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review this provider!</p>
              )}
            </div>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Phone className="h-4 w-4 mr-3" />
                    {provider.phone}
                  </a>
                )}
                
                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    {provider.email}
                  </a>
                )}
                
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="h-4 w-4 mr-3" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/providers/${provider.id}/quote`}
                  className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg text-center font-semibold hover:bg-yellow-600 transition-colors block"
                >
                  Request Free Quote
                </Link>
                
                <Link
                  href={`/providers/${provider.id}/review`}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-center font-semibold hover:bg-gray-50 transition-colors block"
                >
                  Write a Review
                </Link>
                
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-center font-semibold hover:bg-gray-50 transition-colors">
                  Save Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
