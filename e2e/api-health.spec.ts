import { test, expect } from '@playwright/test'

test.describe('API Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health')

    // Should return 200 OK
    expect(response.status()).toBe(200)

    // Should return JSON
    const body = await response.json()

    // Should have required fields
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('uptime')
    expect(body).toHaveProperty('checks')
    expect(body).toHaveProperty('version')

    // Database check should exist
    expect(body.checks).toHaveProperty('database')
    expect(body.checks.database).toHaveProperty('status')
  })

  test('should have rate limit headers', async ({ request }) => {
    const response = await request.get('/api/health')

    // Should include rate limit headers
    const headers = response.headers()
    expect(headers).toHaveProperty('x-ratelimit-limit')
    expect(headers).toHaveProperty('x-ratelimit-remaining')
    expect(headers).toHaveProperty('x-ratelimit-reset')
  })

  test('should enforce rate limiting', async ({ request }) => {
    // Make multiple requests quickly
    const requests = Array.from({ length: 101 }, (_, i) =>
      request.get('/api/health')
    )

    const responses = await Promise.all(requests)

    // At least one should be rate limited (429)
    const rateLimited = responses.some((r) => r.status() === 429)
    expect(rateLimited).toBe(true)
  })
})
