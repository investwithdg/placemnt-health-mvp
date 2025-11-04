/**
 * Simple in-memory rate limiter for API routes
 *
 * Note: This is suitable for basic protection in serverless environments.
 * For production at scale, consider using Redis or Vercel KV for distributed rate limiting.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Unique identifier for the rate limit (e.g., IP address, user ID)
   */
  identifier: string
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number
  /**
   * Time window in milliseconds
   */
  window: number
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean
  /**
   * Remaining requests in the current window
   */
  remaining: number
  /**
   * Total limit
   */
  limit: number
  /**
   * Time when the limit will reset (Unix timestamp in ms)
   */
  reset: number
}

/**
 * Check if a request is within rate limits
 */
export function rateLimit(config: RateLimitConfig): RateLimitResult {
  const { identifier, limit, window } = config
  const now = Date.now()

  // Get or create entry
  const entry = store[identifier]

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    store[identifier] = {
      count: 1,
      resetTime: now + window,
    }

    return {
      success: true,
      remaining: limit - 1,
      limit,
      reset: now + window,
    }
  }

  // Increment counter
  entry.count++

  const success = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)

  return {
    success,
    remaining,
    limit,
    reset: entry.resetTime,
  }
}

/**
 * Get the client identifier from a request
 * Uses IP address or fallback to a header
 */
export function getClientIdentifier(req: Request | any): string {
  // Try to get IP from various headers
  const forwarded = req.headers?.['x-forwarded-for']
  const realIp = req.headers?.['x-real-ip']

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }

  if (typeof realIp === 'string') {
    return realIp
  }

  // Fallback to connection remote address or a default
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for sensitive operations (e.g., auth, payments)
   * 5 requests per minute
   */
  strict: { limit: 5, window: 60 * 1000 },

  /**
   * Standard rate limit for most API endpoints
   * 30 requests per minute
   */
  standard: { limit: 30, window: 60 * 1000 },

  /**
   * Lenient rate limit for public endpoints
   * 100 requests per minute
   */
  lenient: { limit: 100, window: 60 * 1000 },

  /**
   * Very strict rate limit for extremely sensitive operations
   * 3 requests per 5 minutes
   */
  veryStrict: { limit: 3, window: 5 * 60 * 1000 },
}
