import { test, expect } from '@playwright/test'

test.describe('Presupuesto', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and use debug bypass
    await page.goto('/login')
    await page.click('button:has-text("Bypass login")')
    await page.waitForURL('**/dashboard**')
  })

  test('should navigate to presupuesto page', async ({ page }) => {
    // Navigate to presupuesto page
    await page.goto('/presupuesto')
    await page.waitForSelector('text=Dashboard 2', { timeout: 10000 })
    await expect(page.locator('text=Dashboard 2')).toBeVisible()
  })

  test('should display month selector', async ({ page }) => {
    await page.goto('/presupuesto')
    await page.waitForSelector('text=Dashboard 2', { timeout: 10000 })
    
    // Check if month navigation exists
    const monthNavigation = page.locator('text=Proyección de ingresos por mes')
    await expect(monthNavigation).toBeVisible()
  })

  test('should display income statistics', async ({ page }) => {
    await page.goto('/presupuesto')
    await page.waitForSelector('text=Dashboard 2', { timeout: 10000 })
    
    // Check if income stats are visible (stat cards)
    const statCards = page.locator('.stat-card, [class*="StatCard"]')
    await expect(statCards.first()).toBeVisible()
  })

  test('should display income by institution breakdown', async ({ page }) => {
    await page.goto('/presupuesto')
    await page.waitForSelector('text=Dashboard 2', { timeout: 10000 })
    
    // Check if institution breakdown exists (or empty state)
    const breakdown = page.locator('text=Por institución')
    const emptyState = page.locator('text=No hay datos')
    
    // Either breakdown or empty state should be visible
    const hasContent = await breakdown.isVisible() || await emptyState.isVisible()
    await expect(hasContent).toBeTruthy()
  })
})
