import { useState } from 'react'

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

interface TalentCardProps {
  talent: Talent
}

export default function TalentCard({ talent }: TalentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSpecialtyLabel = (specialty: string) => {
    const labels: { [key: string]: string } = {
      'nurse': 'Registered Nurse',
      'physician': 'Physician',
      'therapist': 'Physical Therapist',
      'technologist': 'Medical Technologist',
      'pharmacist': 'Pharmacist',
      'other': 'Other'
    }
    return labels[specialty] || specialty
  }

  const getExperienceLabel = (experience: string) => {
    const labels: { [key: string]: string } = {
      '0-1': '0-1 years',
      '2-5': '2-5 years',
      '6-10': '6-10 years',
      '11-15': '11-15 years',
      '15+': '15+ years'
    }
    return labels[experience] || experience
  }

  const isLicenseExpired = () => {
    return new Date(talent.license_expiry_date) < new Date()
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {talent.full_name}
          </h3>
          
          <div className="space-y-2">
            {talent.specialty && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Specialty:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {getSpecialtyLabel(talent.specialty)}
                </span>
              </div>
            )}

            {talent.experience && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Experience:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {getExperienceLabel(talent.experience)}
                </span>
              </div>
            )}

            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Location:</span>
              <span className="ml-2 text-sm text-gray-600">{talent.state}</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">License:</span>
              <span className="ml-2 text-sm text-gray-600">{talent.license_number}</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Expires:</span>
              <span className={`ml-2 text-sm ${isLicenseExpired() ? 'text-red-600' : 'text-gray-600'}`}>
                {formatDate(talent.license_expiry_date)}
                {isLicenseExpired() && ' (Expired)'}
              </span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-sm text-gray-600">{talent.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Member since:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {formatDate(talent.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
        
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Contact
        </button>
      </div>
    </div>
  )
} 