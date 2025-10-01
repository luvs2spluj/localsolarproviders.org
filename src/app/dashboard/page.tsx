'use client'

// import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Star, MessageSquare, TrendingUp, Users, Plus } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface DashboardStats {
  totalReviews: number
  averageRating: number
  totalLeads: number
  recentActivity: any[]
}

export default function DashboardPage() {
  // const { user, isLoaded } = useUser()
  const user = null
  const isLoaded = true
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    totalLeads: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData()
    }
  }, [isLoaded, user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // This would fetch user-specific data in a real implementation
      // For now, we'll show placeholder data
      setStats({
        totalReviews: 0,
        averageRating: 0,
        totalLeads: 0,
        recentActivity: []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your solar provider activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews Written</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating Given</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quote Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/providers"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600 mr-3" />
              <span className="font-medium">Find Providers</span>
            </Link>

            <Link
              href="/search"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
              <span className="font-medium">Search Reviews</span>
            </Link>

            <Link
              href="/providers?action=add-review"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="font-medium">Write Review</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-purple-600 mr-3" />
              <span className="font-medium">My Profile</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600 mb-4">
                Start by exploring providers or writing your first review.
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Explore Providers
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
