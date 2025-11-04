import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Page should load without errors
    await expect(page).toHaveTitle(/Placement Health/i)
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // Check for key navigation elements
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // Should have login/signup links
    const loginLink = page.getByRole('link', { name: /log in|sign in/i })
    const signupLink = page.getByRole('link', { name: /sign up|get started/i })

    expect(await loginLink.count() + await signupLink.count()).toBeGreaterThan(0)
  })

  test('should display main hero section', async ({ page }) => {
    await page.goto('/')

    // Hero section should be visible
    const heroText = page.locator('h1, h2').first()
    await expect(heroText).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')

    // Page should still load on mobile
    await expect(page.locator('body')).toBeVisible()
  })
})
