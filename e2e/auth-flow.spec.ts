import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load signup page', async ({ page }) => {
    await page.goto('/signup')

    // Should show signup form
    const heading = page.getByRole('heading', { name: /sign up|create account/i })
    await expect(heading).toBeVisible()

    // Should have email input
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should load login page', async ({ page }) => {
    await page.goto('/login')

    // Should show login form
    const heading = page.getByRole('heading', { name: /log in|sign in/i })
    await expect(heading).toBeVisible()

    // Should have email input
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should require email on signup', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit without email
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Should show validation message (HTML5 validation or custom)
    const emailInput = page.locator('input[type="email"]')
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )

    expect(validationMessage).toBeTruthy()
  })

  test('should redirect authenticated users from login page', async ({ page, context }) => {
    // Note: This test will fail without actual auth setup
    // It's here as a placeholder for when auth is configured

    await page.goto('/login')

    // If authenticated, should redirect to dashboard
    // This will need to be updated based on actual auth implementation
  })

  test('should protect dashboard route', async ({ page }) => {
    await page.goto('/app/dashboard')

    // Should redirect to login if not authenticated
    await page.waitForURL(/\/login/, { timeout: 5000 })

    expect(page.url()).toContain('/login')
  })

  test('should protect employer route', async ({ page }) => {
    await page.goto('/employer/dashboard')

    // Should redirect to login if not authenticated
    await page.waitForURL(/\/login/, { timeout: 5000 })

    expect(page.url()).toContain('/login')
  })

  test('should protect admin route', async ({ page }) => {
    await page.goto('/admin')

    // Should redirect to login if not authenticated
    await page.waitForURL(/\/login/, { timeout: 5000 })

    expect(page.url()).toContain('/login')
  })
})
