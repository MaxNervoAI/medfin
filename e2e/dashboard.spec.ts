import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and use debug bypass
    await page.goto('/login')
    
    // Click the bypass login button for testing
    await page.click('button:has-text("Bypass login")')
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**')
  })

  test('should display dashboard with greeting', async ({ page }) => {
    // PageHeader uses "Hola, ${nombre}" pattern
    await expect(page.locator('h1')).toContainText('Hola')
  })

  test('should display stats cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('text=Por cobrar', { timeout: 10000 })
    await expect(page.locator('text=Por cobrar')).toBeVisible()
    await expect(page.locator('text=Cobrado este mes')).toBeVisible()
  })

  test('should display alerts section', async ({ page }) => {
    await page.waitForSelector('text=Alertas', { timeout: 10000 })
    await expect(page.locator('text=Alertas')).toBeVisible()
  })

  test('should display income projection', async ({ page }) => {
    await page.waitForSelector('text=Proyección de ingresos', { timeout: 10000 })
    await expect(page.locator('text=Proyección de ingresos')).toBeVisible()
  })
})
