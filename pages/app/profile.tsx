import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { withAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabaseClient'
import FileUploader from '../../components/FileUploader'

function ProfileCreation({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    fullName: '',
    state: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    specialty: '',
    experience: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check if profile already exists
    const checkProfile = async () => {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        router.push('/app/dashboard/talent')
      }
    }

    checkProfile()
  }, [user.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (fileUrl: string) => {
    setUploadedFiles(prev => [...prev, fileUrl])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: formData.fullName,
          role: 'clinician',
          state: formData.state,
          license_number: formData.licenseNumber,
          license_expiry_date: formData.licenseExpiryDate,
          status: 'pending'
        })

      if (profileError) {
        throw profileError
      }

      // Create credential records for uploaded files
      if (uploadedFiles.length > 0) {
        const credentialRecords = uploadedFiles.map(fileUrl => ({
          user_id: user.id,
          credential_type: 'license',
          file_url: fileUrl,
          verified: false
        }))

        const { error: credentialError } = await supabase
          .from('credentials')
          .insert(credentialRecords)

        if (credentialError) {
          console.error('Error creating credentials:', credentialError)
        }
      }

      setMessage('Profile created successfully! Redirecting...')
      setTimeout(() => {
        router.push('/app/dashboard/talent')
      }, 2000)

    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create Profile - Placement Health</title>
        <meta name="description" content="Create your healthcare professional profile" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Profile
            </h1>
            <p className="mt-2 text-gray-600">
              Help healthcare facilities find you by providing your professional information
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select a state</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                    {/* Add more states as needed */}
                  </select>
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your license number"
                  />
                </div>

                <div>
                  <label htmlFor="licenseExpiryDate" className="block text-sm font-medium text-gray-700">
                    License Expiry Date
                  </label>
                  <input
                    id="licenseExpiryDate"
                    name="licenseExpiryDate"
                    type="date"
                    required
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Specialty
                  </label>
                  <select
                    id="specialty"
                    name="specialty"
                    required
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select your specialty</option>
                    <option value="nurse">Registered Nurse</option>
                    <option value="physician">Physician</option>
                    <option value="therapist">Physical Therapist</option>
                    <option value="technologist">Medical Technologist</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    required
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select experience level</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-15">11-15 years</option>
                    <option value="15+">15+ years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Credentials
                </label>
                <FileUploader onFileUpload={handleFileUpload} />
                {uploadedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Uploaded files: {uploadedFiles.length}
                    </p>
                  </div>
                )}
              </div>

              {message && (
                <div className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Profile...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default withAuth(ProfileCreation) 