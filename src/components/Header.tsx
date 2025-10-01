'use client'

import Link from 'next/link'
// import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { Sun, Search, User } from 'lucide-react'

export default function Header() {
  // const { isSignedIn, user } = useUser()
  const isSignedIn = false // Temporarily disabled for testing
  const user = null

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Sun className="h-8 w-8 text-yellow-500" />
            <span className="text-xl font-bold text-gray-900">
              Local Solar Providers
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/providers" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Find Providers
            </Link>
            <Link 
              href="/register" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Register Business
            </Link>
            {isSignedIn && (
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, User!
                </span>
                <button className="bg-gray-200 text-gray-800 px-3 py-2 rounded-full text-sm">
                  Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign In
                </button>
                <Link 
                  href="/sign-up"
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
