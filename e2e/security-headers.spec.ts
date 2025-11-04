import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('should have all required security headers', async ({ page }) => {
    const response = await page.goto('/')

    expect(response).not.toBeNull()
    const headers = response!.headers()

    // Check for critical security headers
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['strict-transport-security']).toBeTruthy()
    expect(headers['content-security-policy']).toBeTruthy()
    expect(headers['referrer-policy']).toBeTruthy()
  })

  test('should have HSTS header with proper values', async ({ page }) => {
    const response = await page.goto('/')

    expect(response).not.toBeNull()
    const headers = response!.headers()

    const hsts = headers['strict-transport-security']
    expect(hsts).toContain('max-age=')
    expect(hsts).toContain('includeSubDomains')
  })

  test('should have Content-Security-Policy', async ({ page }) => {
    const response = await page.goto('/')

    expect(response).not.toBeNull()
    const headers = response!.headers()

    const csp = headers['content-security-policy']
    expect(csp).toContain('default-src')
    expect(csp).toContain('script-src')
  })

  test('should prevent clickjacking with X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/')

    expect(response).not.toBeNull()
    const headers = response!.headers()

    const xFrameOptions = headers['x-frame-options']
    expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions)
  })

  test('should prevent MIME type sniffing', async ({ page }) => {
    const response = await page.goto('/')

    expect(response).not.toBeNull()
    const headers = response!.headers()

    expect(headers['x-content-type-options']).toBe('nosniff')
  })
})
