import { test, expect } from '@playwright/test'

test.describe('Prestaciones', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and use debug bypass
    await page.goto('/login')
    await page.click('button:has-text("Bypass login")')
    await page.waitForURL('**/dashboard**')
  })

  test('should navigate to prestaciones page', async ({ page }) => {
    // Navigate to prestaciones page
    await page.goto('/prestaciones')
    await page.waitForSelector('text=Prestaciones', { timeout: 10000 })
    await expect(page.locator('text=Prestaciones')).toBeVisible()
  })

  test('should display prestaciones list or empty state', async ({ page }) => {
    await page.goto('/prestaciones')
    await page.waitForSelector('text=Prestaciones', { timeout: 10000 })
    
    // Check if prestaciones list or empty state is visible
    const table = page.locator('table')
    const emptyState = page.locator('text=No hay prestaciones')
    
    // Either table or empty state should be visible
    const hasContent = await table.isVisible() || await emptyState.isVisible()
    await expect(hasContent).toBeTruthy()
  })

  test('should show create button', async ({ page }) => {
    await page.goto('/prestaciones')
    await page.waitForSelector('text=Prestaciones', { timeout: 10000 })
    
    // Check if create button exists (Plus icon button)
    const createButton = page.locator('button').filter({ hasText: 'Nueva prestación' })
    await expect(createButton.first()).toBeVisible()
  })
})
