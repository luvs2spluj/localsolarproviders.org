import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomePageSearch from '@/components/HomePageSearch'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Find Vetted Local Solar Providers Near You
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover trusted solar installers in your area with verified licenses, reviews, and competitive pricing.
          </p>
          <HomePageSearch />
        </div>
      </main>
      <Footer />
    </div>
  )
}