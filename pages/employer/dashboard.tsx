import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { matchingEngine } from '@/lib/services/matching'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  status: string
  applicationsCount: number
  createdAt: string
}

interface Candidate {
  id: string
  name: string
  specialty: string
  fitScore: number
  status: string
}

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
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

      // Load organization's jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (jobsData) {
        const formattedJobs = jobsData.map(job => ({
          id: job.id,
          title: job.title,
          status: job.status,
          applicationsCount: 0, // TODO: Get actual count
          createdAt: job.created_at,
        }))
        setJobs(formattedJobs)
      }

      // Load top candidates (this would be for the most recent job)
      if (jobsData && jobsData.length > 0) {
        const matchResults = await matchingEngine.findCandidatesForJob(jobsData[0].id, 5)
        const formattedCandidates = matchResults.map(match => ({
          id: match.userId,
          name: 'Candidate Name', // TODO: Get from user profile
          specialty: 'RN', // TODO: Get from profile
          fitScore: match.totalScore,
          status: 'available',
        }))
        setCandidates(formattedCandidates)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = () => {
    router.push('/employer/jobs/new')
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
              <Link href="/employer/jobs" className="text-gray-700 hover:text-gray-900">
                Jobs
              </Link>
              <Link href="/employer/candidates" className="text-gray-700 hover:text-gray-900">
                Candidates
              </Link>
              <Link href="/employer/analytics" className="text-gray-700 hover:text-gray-900">
                Analytics
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Employer Dashboard</h2>
              <p className="mt-2 text-gray-600">Manage your job postings and find top talent</p>
            </div>
            <button
              onClick={handleCreateJob}
              className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Post New Job
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Jobs */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Job Postings</h3>
              </div>
              <div className="p-6">
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600">
                            {job.applicationsCount} applications • {job.status}
                          </p>
                        </div>
                        <Link
                          href={`/employer/jobs/${job.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No active job postings</p>
                    <button
                      onClick={handleCreateJob}
                      className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
                    >
                      Create Your First Job
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Candidates */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Matching Candidates</h3>
              </div>
              <div className="p-6">
                {candidates.length > 0 ? (
                  <div className="space-y-4">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">
                            {candidate.specialty} • {candidate.fitScore}% match
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            candidate.fitScore >= 80 ? 'bg-green-100 text-green-800' :
                            candidate.fitScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {candidate.fitScore}%
                          </span>
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No candidates found yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
              <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'active').length}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
              <p className="text-2xl font-bold text-gray-900">{jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Interviews Scheduled</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Offers Extended</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
