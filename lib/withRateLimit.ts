import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit, getClientIdentifier, RateLimitPresets } from './rateLimit'

type RateLimitPreset = keyof typeof RateLimitPresets

interface RateLimitOptions {
  preset?: RateLimitPreset
  limit?: number
  window?: number
}

/**
 * Higher-order function to add rate limiting to API routes
 *
 * @example
 * ```ts
 * export default withRateLimit(handler, { preset: 'strict' })
 * ```
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get rate limit config from preset or custom values
    const config = options.preset
      ? RateLimitPresets[options.preset]
      : { limit: options.limit || 30, window: options.window || 60 * 1000 }

    // Get client identifier
    const identifier = getClientIdentifier(req)

    // Check rate limit
    const result = rateLimit({
      identifier,
      ...config,
    })

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString())
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
    res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString())

    // If rate limit exceeded, return 429
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      res.setHeader('Retry-After', retryAfter.toString())

      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      })
    }

    // Continue with the handler
    return handler(req, res)
  }
}
