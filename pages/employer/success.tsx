import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { withAuth } from '../../lib/auth'

function EmployerSuccess({ user }: { user: any }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { session_id } = router.query

  useEffect(() => {
    if (session_id) {
      // Verify payment was successful
      const verifyPayment = async () => {
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: session_id }),
          })

          if (!response.ok) {
            router.push('/employer/signup')
            return
          }

          setIsLoading(false)
        } catch (error) {
          console.error('Error verifying payment:', error)
          router.push('/employer/signup')
        }
      }

      verifyPayment()
    }
  }, [session_id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Welcome to Placement Health - Payment Successful</title>
        <meta name="description" content="Your payment was successful" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome to Placement Health!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was successful and your account is now active.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  What's Next?
                </h3>
                <p className="text-sm text-gray-600">
                  You now have access to our network of verified healthcare professionals.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">1</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Browse Talent</h4>
                    <p className="text-sm text-gray-600">
                      Search and filter through our verified healthcare professionals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Contact Candidates</h4>
                    <p className="text-sm text-gray-600">
                      Reach out to qualified professionals directly through our platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">3</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Hire with Confidence</h4>
                    <p className="text-sm text-gray-600">
                      All candidates are pre-verified with complete credential checks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/app/dashboard/talent"
                  className="w-full btn-primary"
                >
                  Start Browsing Talent
                </Link>
                
                <Link
                  href="/"
                  className="w-full btn-secondary"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default withAuth(EmployerSuccess) 