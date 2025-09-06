import { useState, useEffect } from 'react'
import Head from 'next/head'
import { withAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  state: string
  license_number: string
  license_expiry_date: string
  created_at: string
}

interface Credential {
  id: string
  user_id: string
  credential_type: string
  file_url: string
  verified: boolean
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

function AdminConsole({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
      } else {
        setUsers(usersData || [])
      }

      // Fetch credentials
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('credentials')
        .select('*')
        .order('created_at', { ascending: false })

      if (credentialsError) {
        console.error('Error fetching credentials:', credentialsError)
      } else {
        setCredentials(credentialsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCredential = async (credentialId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .update({
          verified,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', credentialId)

      if (error) {
        console.error('Error updating credential:', error)
        return
      }

      // Update local state
      setCredentials(prev => prev.map(cred => 
        cred.id === credentialId 
          ? { ...cred, verified, verified_by: user.id, verified_at: new Date().toISOString() }
          : cred
      ))

      // If credential is verified, update user status
      if (verified) {
        const credential = credentials.find(c => c.id === credentialId)
        if (credential) {
          const { error: userError } = await supabase
            .from('users')
            .update({ status: 'verified' })
            .eq('id', credential.user_id)

          if (!userError) {
            setUsers(prev => prev.map(u => 
              u.id === credential.user_id 
                ? { ...u, status: 'verified' }
                : u
            ))
          }
        }
      }
    } catch (error) {
      console.error('Error verifying credential:', error)
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        return
      }

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status } : u
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin console...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Console - Placement Health</title>
        <meta name="description" content="Admin console for managing users and credentials" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Console
            </h1>
            <p className="mt-2 text-gray-600">
              Manage users and verify credentials
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'credentials'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Credentials ({credentials.length})
              </button>
            </nav>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'verified' ? 'bg-green-100 text-green-800' :
                            user.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.state || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={user.status}
                            onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="paid">Paid</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {credentials.map((credential) => {
                      const user = users.find(u => u.id === credential.user_id)
                      return (
                        <tr key={credential.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user?.full_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{user?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {credential.credential_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={credential.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              View File
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              credential.verified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {credential.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(credential.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleVerifyCredential(credential.id, !credential.verified)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                credential.verified
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {credential.verified ? 'Unverify' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default withAuth(AdminConsole) 