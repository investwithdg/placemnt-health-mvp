import { MatchingEngine, type CandidateProfile, type JobRequirements } from '../matching'

const matchingEngine = new MatchingEngine()

describe('MatchingEngine', () => {
  describe('calculateMatch', () => {
    const mockJobDetails = {
      id: 'job-1',
      shift: 'day',
      payBandMin: 50000,
      payBandMax: 70000,
    }

    it('should give perfect score for ideal candidate match', async () => {
      const candidate: CandidateProfile = {
        userId: 'user-1',
        specialty: 'RN',
        experienceYears: 5,
        skills: ['IV insertion', 'patient care'],
        prefs: {
          shiftTypes: ['day'],
          locationRadius: 50,
          payRangeMin: 55000,
          payRangeMax: 65000,
          contractType: 'w2',
        },
        credentials: [
          { type: 'license', issuer: 'California', status: 'verified' },
          { type: 'certification', issuer: 'BLS', status: 'verified' },
        ],
      }

      const jobRequirements: JobRequirements = {
        specialty: 'RN',
        experienceYears: 3,
        licenses: ['California'],
        certifications: ['BLS'],
        skills: ['IV insertion'],
      }

      const result = await matchingEngine.calculateMatch(candidate, jobRequirements, mockJobDetails)

      expect(result.totalScore).toBeGreaterThan(80)
      expect(result.breakdown.licenseMatch).toBe(20)
      expect(result.breakdown.specialtyMatch).toBe(25)
      expect(result.breakdown.experienceMatch).toBe(25)
      expect(result.explanation).toContain('+20 All required licenses verified')
    })

    it('should penalize missing required licenses', async () => {
      const candidate: CandidateProfile = {
        userId: 'user-2',
        specialty: 'RN',
        experienceYears: 5,
        skills: ['IV insertion'],
        prefs: {
          shiftTypes: ['day'],
          locationRadius: 50,
          payRangeMin: 55000,
          payRangeMax: 65000,
          contractType: 'w2',
        },
        credentials: [
          { type: 'license', issuer: 'Texas', status: 'verified' }, // Wrong state
        ],
      }

      const jobRequirements: JobRequirements = {
        specialty: 'RN',
        experienceYears: 3,
        licenses: ['California'], // Requires California license
        certifications: [],
        skills: [],
      }

      const result = await matchingEngine.calculateMatch(candidate, jobRequirements, mockJobDetails)

      expect(result.breakdown.licenseMatch).toBe(-20)
      expect(result.explanation).toContain('-20 Missing required licenses')
    })

    it('should handle pay range overlap correctly', async () => {
      const candidate: CandidateProfile = {
        userId: 'user-3',
        specialty: 'RN',
        experienceYears: 5,
        skills: [],
        prefs: {
          shiftTypes: ['day'],
          locationRadius: 50,
          payRangeMin: 40000, // Lower than job
          payRangeMax: 60000, // Overlaps with job
          contractType: 'w2',
        },
        credentials: [],
      }

      const jobRequirements: JobRequirements = {
        specialty: 'RN',
        experienceYears: 3,
        licenses: [],
        certifications: [],
        skills: [],
      }

      const result = await matchingEngine.calculateMatch(candidate, jobRequirements, mockJobDetails)

      expect(result.breakdown.payMatch).toBeGreaterThan(0)
      expect(result.breakdown.payMatch).toBeLessThanOrEqual(10)
    })

    it('should reward document readiness', async () => {
      const candidate: CandidateProfile = {
        userId: 'user-4',
        specialty: 'RN',
        experienceYears: 5,
        skills: [],
        prefs: {
          shiftTypes: ['day'],
          locationRadius: 50,
          payRangeMin: 55000,
          payRangeMax: 65000,
          contractType: 'w2',
        },
        credentials: [
          { type: 'license', issuer: 'California', status: 'verified' },
          { type: 'certification', issuer: 'BLS', status: 'verified' },
          { type: 'background_check', issuer: 'Checkr', status: 'verified' },
        ],
      }

      const jobRequirements: JobRequirements = {
        specialty: 'RN',
        experienceYears: 3,
        licenses: [],
        certifications: [],
        skills: [],
      }

      const result = await matchingEngine.calculateMatch(candidate, jobRequirements, mockJobDetails)

      expect(result.breakdown.documentReadiness).toBe(20) // All docs verified
      expect(result.explanation).toContain('Document readiness (100%)')
    })
  })

  describe('calculatePayOverlap', () => {
    it('should calculate overlap correctly', () => {
      const engine = new MatchingEngine()

      // Complete overlap
      expect(engine['calculatePayOverlap'](50000, 70000, 50000, 70000)).toBe(1)

      // Partial overlap
      expect(engine['calculatePayOverlap'](40000, 60000, 50000, 80000)).toBeCloseTo(0.33, 1)

      // No overlap
      expect(engine['calculatePayOverlap'](30000, 40000, 50000, 60000)).toBe(0)

      // Candidate range within job range
      expect(engine['calculatePayOverlap'](55000, 65000, 50000, 70000)).toBe(1)
    })
  })
})
