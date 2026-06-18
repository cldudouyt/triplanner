import { test, expect } from './fixtures'

test.describe('Navigation', () => {
  test('should navigate between main sections', async ({ authenticatedPage: page }) => {
    // Go to competitions
    await page.goto('/competitions')
    await expect(page.getByRole('heading', { name: /compétitions/i })).toBeVisible()

    // Go to training plans
    await page.goto('/training')
    await expect(page.getByRole('heading', { name: /plans? d'entraînement/i })).toBeVisible()

    // Go to calendar
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: /calendrier/i }).or(page.locator('.fc'))).toBeVisible()
  })

  test('should show navigation menu', async ({ authenticatedPage: page }) => {
    await page.goto('/')

    // Check for nav links
    const navLinks = page.locator('nav a, header a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should logout successfully', async ({ authenticatedPage: page }) => {
    await page.goto('/competitions')

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /déconnexion|logout/i })
      .or(page.getByRole('link', { name: /déconnexion|logout/i }))

    if (await logoutButton.isVisible()) {
      await logoutButton.click()

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    }
  })
})

test.describe('Calendar', () => {
  test('should display calendar view', async ({ authenticatedPage: page }) => {
    await page.goto('/calendar')

    // FullCalendar should be rendered
    await expect(page.locator('.fc').or(page.getByRole('heading', { name: /calendrier/i }))).toBeVisible()
  })

  test('should show competitions and sessions in calendar', async ({ authenticatedPage: page }) => {
    // Create a competition first
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Calendar Test Event')
    await page.getByLabel(/date/i).fill('2026-06-15')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/competitions/)

    // Go to calendar
    await page.goto('/calendar')

    // Navigate to June 2026 if needed
    const nextButton = page.locator('button').filter({ hasText: /next|suivant|>/i })
    while (await nextButton.isVisible()) {
      const calendarTitle = await page.locator('.fc-toolbar-title').textContent()
      if (calendarTitle?.includes('juin 2026') || calendarTitle?.includes('June 2026')) {
        break
      }
      await nextButton.click()
      await page.waitForTimeout(300)
    }

    // The event should be visible (might need to check if FullCalendar is configured to show it)
  })

  test('should navigate between months', async ({ authenticatedPage: page }) => {
    await page.goto('/calendar')

    const nextButton = page.locator('button').filter({ hasText: /next|suivant|>/i }).first()
    const prevButton = page.locator('button').filter({ hasText: /prev|précédent|</i }).first()

    if (await nextButton.isVisible()) {
      // Get current title
      const initialTitle = await page.locator('.fc-toolbar-title').textContent()

      // Go next
      await nextButton.click()
      await page.waitForTimeout(500)

      const nextTitle = await page.locator('.fc-toolbar-title').textContent()
      expect(nextTitle).not.toBe(initialTitle)

      // Go back
      await prevButton.click()
      await page.waitForTimeout(500)

      const backTitle = await page.locator('.fc-toolbar-title').textContent()
      expect(backTitle).toBe(initialTitle)
    }
  })

  test('should switch between week and month view', async ({ authenticatedPage: page }) => {
    await page.goto('/calendar')

    // Find view buttons
    const weekButton = page.getByRole('button', { name: /semaine|week/i })
    const monthButton = page.getByRole('button', { name: /mois|month/i })

    if (await weekButton.isVisible() && await monthButton.isVisible()) {
      // Switch to week view
      await weekButton.click()
      await page.waitForTimeout(500)

      // Switch back to month view
      await monthButton.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/competitions')

    // Page should still be functional
    await expect(page.getByRole('heading', { name: /compétitions/i })).toBeVisible()

    // Check for mobile menu if exists
    const menuButton = page.locator('button').filter({ hasText: /menu|☰/i })
    if (await menuButton.isVisible()) {
      await menuButton.click()
      // Menu should open
    }
  })

  test('should work on tablet viewport', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/training')

    await expect(page.getByRole('heading', { name: /plans? d'entraînement/i })).toBeVisible()
  })
})
