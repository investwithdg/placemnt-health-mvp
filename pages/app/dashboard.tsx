import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { matchingEngine } from '@/lib/services/matching'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface JobMatch {
  jobId: string
  title: string
  facility: string
  location: string
  shift: string
  payRange: string
  fitScore: number
  explanation: string[]
}

export default function CandidateDashboard() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load job matches
      const matchResults = await matchingEngine.findMatchesForCandidate(user.id, 10)
      const formattedMatches = matchResults.map(match => ({
        jobId: match.jobId,
        title: 'Sample Job Title', // TODO: Get from job data
        facility: 'Sample Facility',
        location: 'Sample Location',
        shift: 'Day',
        payRange: '$50-70k',
        fitScore: match.totalScore,
        explanation: match.explanation,
      }))

      setMatches(formattedMatches)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (jobId: string) => {
    try {
      // TODO: Implement application submission
      toast.success('Application submitted!')
    } catch (error) {
      toast.error('Failed to submit application')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Placement Health</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/app/profile" className="text-gray-700 hover:text-gray-900">
                Profile
              </Link>
              <Link href="/app/credentials" className="text-gray-700 hover:text-gray-900">
                Credentials
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
            <p className="mt-2 text-gray-600">Here are your top job matches</p>
          </div>

          {/* Job Matches */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, index) => (
              <div key={match.jobId} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{match.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      match.fitScore >= 80 ? 'bg-green-100 text-green-800' :
                      match.fitScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {match.fitScore}% match
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><strong>Facility:</strong> {match.facility}</p>
                    <p><strong>Location:</strong> {match.location}</p>
                    <p><strong>Shift:</strong> {match.shift}</p>
                    <p><strong>Pay:</strong> {match.payRange}</p>
                  </div>

                  {/* Match Explanation */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Why this matches:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {match.explanation.slice(0, 3).map((exp, i) => (
                        <li key={i} className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            exp.startsWith('+') ? 'bg-green-400' :
                            exp.startsWith('-') ? 'bg-red-400' :
                            'bg-gray-400'
                          }`}></span>
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApply(match.jobId)}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {matches.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 mb-4">
                Complete your profile and credentials to get better matches
              </p>
              <Link
                href="/app/profile"
                className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
              >
                Update Profile
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
