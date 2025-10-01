import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import UserProvider from '@/components/UserProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Local Solar Providers - Find Vetted Local Solar Providers Near You',
  description: 'Find vetted local solar providers near you. Discover trusted solar installers in your area with verified licenses, reviews, and competitive pricing.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_cG9zc2libGUtc2N1bHBpbi0yOS5jbGVyay5hY2NvdW50cy5kZXYk'
  
  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en">
        <body className={inter.className}>
          <UserProvider>
            {children}
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}