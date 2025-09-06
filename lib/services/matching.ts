import { db } from '@/lib/db'
import { users, profiles, credentials, jobs, applications } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export interface MatchScore {
  jobId: string
  userId: string
  totalScore: number
  breakdown: {
    licenseMatch: number
    specialtyMatch: number
    experienceMatch: number
    availabilityMatch: number
    payMatch: number
    documentReadiness: number
    responsiveness: number
  }
  explanation: string[]
}

export interface JobRequirements {
  specialty: string
  experienceYears: number
  licenses: string[]
  certifications: string[]
  skills: string[]
}

export interface CandidateProfile {
  userId: string
  specialty: string
  experienceYears: number
  skills: string[]
  prefs: {
    shiftTypes: string[]
    locationRadius: number
    payRangeMin: number
    payRangeMax: number
    contractType: 'w2' | '1099' | 'both'
  }
  credentials: Array<{
    type: string
    issuer: string
    status: string
    expDate?: Date
  }>
}

export class MatchingEngine {
  /**
   * Calculate match score between a candidate and job
   */
  async calculateMatch(
    candidate: CandidateProfile,
    jobRequirements: JobRequirements,
    jobDetails: any
  ): Promise<MatchScore> {
    const breakdown = {
      licenseMatch: 0,
      specialtyMatch: 0,
      experienceMatch: 0,
      availabilityMatch: 0,
      payMatch: 0,
      documentReadiness: 0,
      responsiveness: 0,
    }

    const explanation: string[] = []

    // 1. License Match (Hard gate - required licenses must be present and verified)
    const requiredLicenses = jobRequirements.licenses
    const candidateLicenses = candidate.credentials.filter(
      cred => cred.type === 'license' && cred.status === 'verified'
    )

    if (requiredLicenses.length > 0) {
      const matchedLicenses = requiredLicenses.filter(required =>
        candidateLicenses.some(license =>
          license.issuer.toLowerCase().includes(required.toLowerCase()) ||
          required.toLowerCase().includes(license.issuer.toLowerCase())
        )
      )

      if (matchedLicenses.length === requiredLicenses.length) {
        breakdown.licenseMatch = 20
        explanation.push('+20 All required licenses verified')
      } else if (matchedLicenses.length > 0) {
        breakdown.licenseMatch = 10
        explanation.push('+10 Some required licenses verified')
      } else {
        breakdown.licenseMatch = -20
        explanation.push('-20 Missing required licenses')
      }
    } else {
      breakdown.licenseMatch = 10
      explanation.push('+10 No specific license requirements')
    }

    // 2. Specialty Match
    if (candidate.specialty.toLowerCase() === jobRequirements.specialty.toLowerCase()) {
      breakdown.specialtyMatch = 25
      explanation.push('+25 Specialty match')
    } else if (candidate.specialty.toLowerCase().includes(jobRequirements.specialty.toLowerCase()) ||
               jobRequirements.specialty.toLowerCase().includes(candidate.specialty.toLowerCase())) {
      breakdown.specialtyMatch = 15
      explanation.push('+15 Related specialty')
    } else {
      breakdown.specialtyMatch = 0
      explanation.push('±0 Specialty mismatch')
    }

    // 3. Experience Match
    const expDiff = candidate.experienceYears - jobRequirements.experienceYears
    if (expDiff >= 0) {
      breakdown.experienceMatch = Math.min(25, 15 + expDiff * 2)
      explanation.push(`+${breakdown.experienceMatch} Experience match (${candidate.experienceYears}y vs ${jobRequirements.experienceYears}y required)`)
    } else {
      breakdown.experienceMatch = Math.max(0, 15 + expDiff * 2)
      explanation.push(`+${breakdown.experienceMatch} Experience below requirement`)
    }

    // 4. Availability Match
    const shiftMatch = jobDetails.shift && candidate.prefs.shiftTypes?.includes(jobDetails.shift)
    if (shiftMatch) {
      breakdown.availabilityMatch = 20
      explanation.push('+20 Shift availability match')
    } else {
      breakdown.availabilityMatch = 5
      explanation.push('+5 Partial availability match')
    }

    // 5. Pay Match
    const payOverlap = this.calculatePayOverlap(
      candidate.prefs.payRangeMin,
      candidate.prefs.payRangeMax,
      jobDetails.payBandMin,
      jobDetails.payBandMax
    )

    breakdown.payMatch = payOverlap * 10 // 0-10 points
    explanation.push(`+${breakdown.payMatch.toFixed(1)} Pay range overlap (${payOverlap * 100}%)`)

    // 6. Document Readiness
    const verifiedCredentials = candidate.credentials.filter(
      cred => cred.status === 'verified'
    ).length

    const totalCredentials = candidate.credentials.length
    const readinessRatio = totalCredentials > 0 ? verifiedCredentials / totalCredentials : 0

    breakdown.documentReadiness = readinessRatio * 20 // 0-20 points
    explanation.push(`+${breakdown.documentReadiness.toFixed(1)} Document readiness (${Math.round(readinessRatio * 100)}%)`)

    // 7. Responsiveness (placeholder - would be calculated from application history)
    breakdown.responsiveness = 7.5 // Average score for now
    explanation.push('+7.5 Responsiveness score')

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

    return {
      jobId: jobDetails.id,
      userId: candidate.userId,
      totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
      breakdown,
      explanation,
    }
  }

  /**
   * Calculate pay range overlap percentage
   */
  private calculatePayOverlap(
    candidateMin: number,
    candidateMax: number,
    jobMin: number,
    jobMax: number
  ): number {
    const overlapStart = Math.max(candidateMin, jobMin)
    const overlapEnd = Math.min(candidateMax, jobMax)

    if (overlapStart >= overlapEnd) return 0

    const overlapRange = overlapEnd - overlapStart
    const candidateRange = candidateMax - candidateMin
    const jobRange = jobMax - jobMin

    return Math.min(overlapRange / candidateRange, overlapRange / jobRange, 1)
  }

  /**
   * Find matches for a specific candidate
   */
  async findMatchesForCandidate(userId: string, limit = 20): Promise<MatchScore[]> {
    // Get candidate profile
    const candidateData = await db
      .select({
        userId: users.id,
        specialty: profiles.specialty,
        experienceYears: profiles.experienceYears,
        skills: profiles.skills,
        prefs: profiles.prefsJson,
        credentials: sql`
          json_agg(
            json_build_object(
              'type', ${credentials.type},
              'issuer', ${credentials.issuer},
              'status', ${credentials.status},
              'expDate', ${credentials.expDate}
            )
          ) FILTER (WHERE ${credentials.id} IS NOT NULL)
        `,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(credentials, eq(users.id, credentials.userId))
      .where(eq(users.id, userId))
      .groupBy(users.id, profiles.id)
      .limit(1)

    if (!candidateData[0]) return []

    const candidate: CandidateProfile = {
      userId: candidateData[0].userId,
      specialty: candidateData[0].specialty,
      experienceYears: candidateData[0].experienceYears,
      skills: candidateData[0].skills as string[],
      prefs: candidateData[0].prefs as any,
      credentials: candidateData[0].credentials || [],
    }

    // Get active jobs
    const activeJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'active'))
      .limit(100) // Limit for performance

    const matches: MatchScore[] = []

    for (const job of activeJobs) {
      const jobRequirements: JobRequirements = {
        specialty: job.requirements.specialty,
        experienceYears: job.requirements.experienceYears,
        licenses: job.requirements.licenses,
        certifications: job.requirements.certifications,
        skills: job.requirements.skills,
      }

      const match = await this.calculateMatch(candidate, jobRequirements, {
        id: job.id,
        shift: job.shift,
        payBandMin: job.payBandJson.min,
        payBandMax: job.payBandJson.max,
      })

      matches.push(match)
    }

    // Sort by score descending and return top matches
    return matches
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  }

  /**
   * Find candidates for a specific job
   */
  async findCandidatesForJob(jobId: string, limit = 50): Promise<MatchScore[]> {
    // Get job details
    const jobData = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1)

    if (!jobData[0]) return []

    const job = jobData[0]
    const jobRequirements: JobRequirements = {
      specialty: job.requirements.specialty,
      experienceYears: job.requirements.experienceYears,
      licenses: job.requirements.licenses,
      certifications: job.requirements.certifications,
      skills: job.requirements.skills,
    }

    // Get candidate profiles
    const candidatesData = await db
      .select({
        userId: users.id,
        specialty: profiles.specialty,
        experienceYears: profiles.experienceYears,
        skills: profiles.skills,
        prefs: profiles.prefsJson,
        credentials: sql`
          json_agg(
            json_build_object(
              'type', ${credentials.type},
              'issuer', ${credentials.issuer},
              'status', ${credentials.status},
              'expDate', ${credentials.expDate}
            )
          ) FILTER (WHERE ${credentials.id} IS NOT NULL)
        `,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(credentials, eq(users.id, credentials.userId))
      .where(and(
        eq(users.role, 'professional'),
        eq(profiles.specialty, jobRequirements.specialty) // Basic filter for performance
      ))
      .groupBy(users.id, profiles.id)
      .limit(200) // Limit for performance

    const matches: MatchScore[] = []

    for (const candidateData of candidatesData) {
      const candidate: CandidateProfile = {
        userId: candidateData.userId,
        specialty: candidateData.specialty,
        experienceYears: candidateData.experienceYears,
        skills: candidateData.skills as string[],
        prefs: candidateData.prefs as any,
        credentials: candidateData.credentials || [],
      }

      const match = await this.calculateMatch(candidate, jobRequirements, {
        id: job.id,
        shift: job.shift,
        payBandMin: job.payBandJson.min,
        payBandMax: job.payBandJson.max,
      })

      matches.push(match)
    }

    // Sort by score descending and return top matches
    return matches
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  }

  /**
   * Update application fit scores in bulk
   */
  async updateApplicationScores(jobId: string): Promise<void> {
    const matches = await this.findCandidatesForJob(jobId, 100)

    for (const match of matches) {
      await db
        .update(applications)
        .set({
          fitScore: match.totalScore.toString(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(applications.jobId, match.jobId),
          eq(applications.userId, match.userId)
        ))
    }
  }
}

// Export singleton instance
export const matchingEngine = new MatchingEngine()
