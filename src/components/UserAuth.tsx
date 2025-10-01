"use client"

import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { useUserContext } from './UserProvider'

export default function UserAuth() {
  const { user, isLoaded } = useUser()
  const { savedInstallers } = useUserContext()

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </div>
    )
  }

  if (user) {
    const savedCount = Object.keys(savedInstallers).length
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          {savedCount > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {savedCount} saved list{savedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <SignInButton mode="modal">
        <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="bg-yellow-500 text-white text-sm px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  )
}
