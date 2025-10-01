'use client'

import Link from 'next/link'
import { Sun, Search, User } from 'lucide-react'
import UserAuth from './UserAuth'

export default function Header() {

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
          </nav>

          {/* User Actions */}
          <UserAuth />
        </div>
      </div>
    </header>
  )
}
