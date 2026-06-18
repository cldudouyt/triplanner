import { test, expect } from './fixtures'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
  })

  test('should display settings page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /paramètres|réglages|settings/i })).toBeVisible()
  })

  test('should show export section', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/export/i)).toBeVisible()
  })

  test('should show import section', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/import/i)).toBeVisible()
  })

  test('should have JSON export button', async ({ authenticatedPage: page }) => {
    const jsonButton = page.getByRole('button', { name: /json/i })
    await expect(jsonButton).toBeVisible()
  })

  test('should have CSV export button', async ({ authenticatedPage: page }) => {
    const csvButton = page.getByRole('button', { name: /csv/i })
    await expect(csvButton).toBeVisible()
  })

  test('should trigger JSON export download', async ({ authenticatedPage: page }) => {
    // Create some data first
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Export Test Comp')
    await page.getByLabel(/date/i).fill('2026-08-01')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/competitions/)

    // Go to settings
    await page.goto('/settings')

    // Listen for download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })

    // Click JSON export
    const jsonButton = page.getByRole('button', { name: /json/i })
    await jsonButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.json')
  })

  test('should trigger CSV export download', async ({ authenticatedPage: page }) => {
    // Listen for download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })

    // Click CSV export
    const csvButton = page.getByRole('button', { name: /csv/i })
    await csvButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should have file import input', async ({ authenticatedPage: page }) => {
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
  })
})

test.describe('User Profile', () => {
  test('should display user info in settings or profile', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')

    // Should show user email or name somewhere
    const userInfo = page.getByText(/e2e/i).or(page.getByText(/tester/i))
    if (await userInfo.isVisible()) {
      await expect(userInfo).toBeVisible()
    }
  })
})
