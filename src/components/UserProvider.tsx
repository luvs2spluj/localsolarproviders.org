"use client"

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface SavedInstallers {
  [key: string]: any[]
}

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [savedInstallers, setSavedInstallers] = useState<SavedInstallers>({})

  // Load saved installers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedInstallers')
    if (saved) {
      try {
        setSavedInstallers(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved installers:', error)
      }
    }
  }, [])

  // Save installers list to localStorage
  const saveInstallersList = (location: string, installers: any[]) => {
    const updated = {
      ...savedInstallers,
      [location]: installers
    }
    setSavedInstallers(updated)
    localStorage.setItem('savedInstallers', JSON.stringify(updated))
  }

  // Get saved installers for a location
  const getSavedInstallers = (location: string) => {
    return savedInstallers[location] || []
  }

  // Clear saved installers
  const clearSavedInstallers = () => {
    setSavedInstallers({})
    localStorage.removeItem('savedInstallers')
  }

  // Provide context to children
  const contextValue = {
    user,
    isLoaded,
    savedInstallers,
    saveInstallersList,
    getSavedInstallers,
    clearSavedInstallers
  }

  return (
    <div data-user-context={JSON.stringify(contextValue)}>
      {children}
    </div>
  )
}

// Hook to use user context
export function useUserContext() {
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoaded: false,
      savedInstallers: {},
      saveInstallersList: () => {},
      getSavedInstallers: () => [],
      clearSavedInstallers: () => {}
    }
  }

  const contextElement = document.querySelector('[data-user-context]')
  if (!contextElement) {
    return {
      user: null,
      isLoaded: false,
      savedInstallers: {},
      saveInstallersList: () => {},
      getSavedInstallers: () => [],
      clearSavedInstallers: () => {}
    }
  }

  try {
    return JSON.parse(contextElement.getAttribute('data-user-context') || '{}')
  } catch (error) {
    console.error('Error parsing user context:', error)
    return {
      user: null,
      isLoaded: false,
      savedInstallers: {},
      saveInstallersList: () => {},
      getSavedInstallers: () => [],
      clearSavedInstallers: () => {}
    }
  }
}
