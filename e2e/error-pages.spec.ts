import { test, expect } from '@playwright/test'

test.describe('Error Pages', () => {
  test('should show custom 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345', {
      waitUntil: 'networkidle',
    })

    // Should show 404 heading
    const heading = page.getByRole('heading', { name: /404|not found/i })
    await expect(heading).toBeVisible()

    // Should have "Go Home" link
    const homeLink = page.getByRole('link', { name: /go home/i })
    await expect(homeLink).toBeVisible()

    // Should have "Go Back" button
    const backButton = page.getByRole('button', { name: /go back/i })
    await expect(backButton).toBeVisible()
  })

  test('404 page should navigate home', async ({ page }) => {
    await page.goto('/non-existent-page')

    const homeLink = page.getByRole('link', { name: /go home/i })
    await homeLink.click()

    // Should navigate to homepage
    await expect(page).toHaveURL('/')
  })

  test('404 page should go back', async ({ page }) => {
    // Start from homepage
    await page.goto('/')

    // Navigate to non-existent page
    await page.goto('/non-existent-page')

    // Click back button
    const backButton = page.getByRole('button', { name: /go back/i })
    await backButton.click()

    // Should be back at homepage
    await expect(page).toHaveURL('/')
  })
})
