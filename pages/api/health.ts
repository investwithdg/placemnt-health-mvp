import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/db'
import { sql } from 'drizzle-orm'

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

interface HealthCheckResponse {
  status: HealthStatus
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
  }
  version: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  let overallStatus: HealthStatus = 'healthy'

  // Check database connectivity
  const dbCheck = await checkDatabase()

  if (dbCheck.status === 'down') {
    overallStatus = 'unhealthy'
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: dbCheck,
    },
    version: process.env.npm_package_version || '1.0.0',
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 503

  return res.status(statusCode).json(response)
}

/**
 * Check database connectivity with a simple query
 */
async function checkDatabase(): Promise<{
  status: 'up' | 'down'
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Simple query to check database connectivity
    await db.execute(sql`SELECT 1`)

    const responseTime = Date.now() - startTime

    return {
      status: 'up',
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    return {
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}
