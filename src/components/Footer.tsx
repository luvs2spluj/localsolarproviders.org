import Link from 'next/link'
import { Sun } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Sun className="h-8 w-8 text-yellow-500" />
              <span className="text-xl font-bold">Local Solar Providers</span>
            </Link>
            <p className="text-gray-300 mb-4 max-w-md">
              Find vetted local solar providers near you. Discover trusted solar installers in your area with verified licenses, reviews, and competitive pricing.
            </p>
            <p className="text-sm text-gray-400">
              Part of the EnergyDaddy.online network
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/providers" className="text-gray-300 hover:text-white transition-colors">
                  Find Providers
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Local Solar Providers. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/api-docs" className="text-gray-400 hover:text-white text-sm transition-colors">
              API Documentation
            </Link>
            <Link href="https://energydaddy.online" className="text-gray-400 hover:text-white text-sm transition-colors">
              EnergyDaddy.online
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
