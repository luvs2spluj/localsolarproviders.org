import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Get Started</h1>
          <p className="text-gray-600 mt-2">Create your Solar Providers Online account</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
