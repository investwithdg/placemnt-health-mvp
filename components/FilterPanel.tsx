import { useState } from 'react'

interface FilterPanelProps {
  filters: {
    state: string
    specialty: string
    experience: string
  }
  onFilterChange: (filters: any) => void
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      state: '',
      specialty: '',
      experience: ''
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '')

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* State Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={localFilters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="input-field"
          >
            <option value="">All states</option>
            <option value="CA">California</option>
            <option value="NY">New York</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="IL">Illinois</option>
            <option value="PA">Pennsylvania</option>
            <option value="OH">Ohio</option>
            <option value="GA">Georgia</option>
            <option value="NC">North Carolina</option>
            <option value="MI">Michigan</option>
          </select>
        </div>

        {/* Specialty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialty
          </label>
          <select
            value={localFilters.specialty}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
            className="input-field"
          >
            <option value="">All specialties</option>
            <option value="nurse">Registered Nurse</option>
            <option value="physician">Physician</option>
            <option value="therapist">Physical Therapist</option>
            <option value="technologist">Medical Technologist</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Experience Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <select
            value={localFilters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
            className="input-field"
          >
            <option value="">All experience levels</option>
            <option value="0-1">0-1 years</option>
            <option value="2-5">2-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="11-15">11-15 years</option>
            <option value="15+">15+ years</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
            <div className="space-y-1">
              {localFilters.state && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">State: {localFilters.state}</span>
                  <button
                    onClick={() => handleFilterChange('state', '')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
              {localFilters.specialty && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Specialty: {localFilters.specialty}</span>
                  <button
                    onClick={() => handleFilterChange('specialty', '')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
              {localFilters.experience && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Experience: {localFilters.experience}</span>
                  <button
                    onClick={() => handleFilterChange('experience', '')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 