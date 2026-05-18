import { test, expect } from '@playwright/test'

test.describe('Instituciones', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and use debug bypass
    await page.goto('/login')
    await page.click('button:has-text("Bypass login")')
    await page.waitForURL('**/dashboard**')
  })

  test('should navigate to instituciones page', async ({ page }) => {
    // Navigate to instituciones page
    await page.goto('/instituciones')
    await page.waitForSelector('text=Lugares de trabajo', { timeout: 10000 })
    await expect(page.locator('text=Lugares de trabajo')).toBeVisible()
  })

  test('should display instituciones list or empty state', async ({ page }) => {
    await page.goto('/instituciones')
    await page.waitForSelector('text=Lugares de trabajo', { timeout: 10000 })
    
    // Check if instituciones list or empty state is visible
    const cards = page.locator('.card')
    const emptyState = page.locator('text=No hay instituciones')
    
    // Either cards or empty state should be visible
    const hasContent = await cards.count() > 0 || await emptyState.isVisible()
    await expect(hasContent).toBeTruthy()
  })

  test('should show create institution button', async ({ page }) => {
    await page.goto('/instituciones')
    await page.waitForSelector('text=Lugares de trabajo', { timeout: 10000 })
    
    // Check if create button exists (Plus icon button)
    const createButton = page.locator('button:has-text("Nueva institución")')
    await expect(createButton).toBeVisible()
  })
})
