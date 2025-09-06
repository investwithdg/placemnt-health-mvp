import { useState, useEffect } from 'react'
import Head from 'next/head'
import { withAuth } from '../../../lib/auth'
import { supabase } from '../../../lib/supabaseClient'
import TalentCard from '../../../components/TalentCard'
import FilterPanel from '../../../components/FilterPanel'
import Navbar from '../../../components/Navbar'

interface Talent {
  id: string
  full_name: string
  email: string
  state: string
  license_number: string
  license_expiry_date: string
  specialty?: string
  experience?: string
  status: string
  created_at: string
}

function TalentDashboard({ user }: { user: any }) {
  const [talents, setTalents] = useState<Talent[]>([])
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    state: '',
    specialty: '',
    experience: ''
  })

  useEffect(() => {
    fetchTalents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [talents, filters])

  const fetchTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'clinician')
        .eq('status', 'verified')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching talents:', error)
        return
      }

      setTalents(data || [])
    } catch (error) {
      console.error('Error fetching talents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = talents

    if (filters.state) {
      filtered = filtered.filter(talent => talent.state === filters.state)
    }

    if (filters.specialty) {
      filtered = filtered.filter(talent => talent.specialty === filters.specialty)
    }

    if (filters.experience) {
      filtered = filtered.filter(talent => talent.experience === filters.experience)
    }

    setFilteredTalents(filtered)
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading talent...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Talent Dashboard - Placement Health</title>
        <meta name="description" content="Browse verified healthcare professionals" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Healthcare Talent
            </h1>
            <p className="mt-2 text-gray-600">
              Browse our network of verified healthcare professionals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Panel */}
            <div className="lg:col-span-1">
              <FilterPanel 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Talent List */}
            <div className="lg:col-span-3">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {filteredTalents.length} professionals found
                </p>
              </div>

              {filteredTalents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No professionals found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTalents.map((talent) => (
                    <TalentCard key={talent.id} talent={talent} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default withAuth(TalentDashboard) 