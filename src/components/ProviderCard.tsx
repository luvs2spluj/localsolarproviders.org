import Link from 'next/link'
import { Star, MapPin, Phone, Globe, Award } from 'lucide-react'

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

interface ProviderCardProps {
  provider: Provider
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const rating = provider.overallRating ? parseFloat(provider.overallRating) : 0
  const reviewCount = provider.totalReviews || 0

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {provider.businessName || provider.name}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{provider.location}</span>
            </div>
          </div>
          {provider.isVerified && (
            <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              <Award className="h-3 w-3 mr-1" />
              Verified
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
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
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        {/* Specialties */}
        {provider.specialties && provider.specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  {specialty}
                </span>
              ))}
              {provider.specialties.length > 3 && (
                <span className="text-gray-500 text-xs">
                  +{provider.specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description & Search Snippets */}
        {(provider as any).description && (
          <div className="mb-4">
            <p className="text-gray-600 text-sm line-clamp-2">
              {(provider as any).description}
            </p>
          </div>
        )}

        {(provider as any).searchSnippets && (provider as any).searchSnippets.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 space-y-1">
              {(provider as any).searchSnippets.slice(0, 2).map((snippet: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="text-green-500 mr-1 flex-shrink-0">✓</span>
                  <span className="line-clamp-1">{snippet}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 mb-4">
          {provider.averageCostPerWatt && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Average Cost:</span> ${provider.averageCostPerWatt}/watt
            </div>
          )}
          {provider.yearsInBusiness && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Experience:</span> {provider.yearsInBusiness} years
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-3">
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="text-blue-600 hover:text-blue-800"
                title="Call"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="Visit Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* External Review Links */}
        {provider.externalLinks && provider.externalLinks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Check Reviews:</p>
            <div className="flex flex-wrap gap-2">
              {provider.externalLinks.slice(0, 3).map((link: any, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  {link.kind === 'GOOGLE' ? 'Google' : 
                   link.kind === 'YELP' ? 'Yelp' : 
                   link.kind === 'BBB' ? 'BBB' : 
                   link.kind === 'FACEBOOK' ? 'Facebook' : 
                   'Reviews'}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            href={`/providers/${provider.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/providers/${provider.id}/quote`}
            className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
          >
            Get Quote
          </Link>
        </div>
      </div>
    </div>
  )
}
