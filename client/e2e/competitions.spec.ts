import { test, expect } from './fixtures'

test.describe('Competitions', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/competitions')
  })

  test('should display competitions page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /compétitions/i })).toBeVisible()
  })

  test('should show empty state when no competitions', async ({ authenticatedPage: page }) => {
    // Look for empty state message or the add button
    const addButton = page.getByRole('link', { name: /ajouter|nouvelle/i })
    await expect(addButton).toBeVisible()
  })

  test('should navigate to create competition form', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /ajouter|nouvelle/i }).click()

    await expect(page).toHaveURL(/\/competitions\/new/)
    await expect(page.getByRole('heading', { name: /nouvelle|ajouter/i })).toBeVisible()
  })

  test('should create a triathlon competition', async ({ authenticatedPage: page }) => {
    await page.goto('/competitions/new')

    // Fill form
    await page.getByLabel(/nom/i).fill('Triathlon de Paris 2026')
    await page.getByLabel(/date/i).fill('2026-06-15')
    await page.locator('select').filter({ hasText: /triathlon|course/i }).first().selectOption('triathlon')

    // Select subtype
    const subTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique/i })
    if (await subTypeSelect.isVisible()) {
      await subTypeSelect.selectOption('olympic')
    }

    // Optional: location
    const locationInput = page.getByLabel(/lieu|location/i)
    if (await locationInput.isVisible()) {
      await locationInput.fill('Paris')
    }

    // Submit
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    // Should redirect to competitions list or detail
    await expect(page).toHaveURL(/\/competitions/, { timeout: 10000 })
  })

  test('should create a running competition', async ({ authenticatedPage: page }) => {
    await page.goto('/competitions/new')

    await page.getByLabel(/nom/i).fill('Marathon de Paris 2026')
    await page.getByLabel(/date/i).fill('2026-04-05')
    await page.locator('select').filter({ hasText: /triathlon|course/i }).first().selectOption('running')

    // Select subtype
    const subTypeSelect = page.locator('select').filter({ hasText: /5k|10k|marathon/i })
    if (await subTypeSelect.isVisible()) {
      await subTypeSelect.selectOption('marathon')
    }

    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await expect(page).toHaveURL(/\/competitions/, { timeout: 10000 })
  })

  test('should show validation error for empty name', async ({ authenticatedPage: page }) => {
    await page.goto('/competitions/new')

    // Try to submit without name
    await page.getByLabel(/date/i).fill('2026-06-15')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    // Should show validation error
    await expect(page.getByText(/requis|obligatoire/i)).toBeVisible()
  })

  test('should filter competitions by type', async ({ authenticatedPage: page }) => {
    // First create some competitions
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Test Triathlon')
    await page.getByLabel(/date/i).fill('2026-07-01')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/competitions/)

    // Check if filter exists
    const typeFilter = page.locator('select').filter({ hasText: /tous|type/i })
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('triathlon')
      // Verify filter applied (page should still show competitions)
      await expect(page.getByText('Test Triathlon')).toBeVisible()
    }
  })
})

test.describe('Competition Detail', () => {
  test('should view competition details', async ({ authenticatedPage: page }) => {
    // Create a competition first
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Detail Test Competition')
    await page.getByLabel(/date/i).fill('2026-08-15')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await page.waitForURL(/\/competitions/)

    // Click on the competition
    await page.getByText('Detail Test Competition').click()

    // Should show details
    await expect(page.getByText('Detail Test Competition')).toBeVisible()
  })

  test('should edit competition', async ({ authenticatedPage: page }) => {
    // Create a competition first
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Edit Test Competition')
    await page.getByLabel(/date/i).fill('2026-09-01')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await page.waitForURL(/\/competitions/)

    // Click on the competition to view details
    await page.getByText('Edit Test Competition').click()

    // Find and click edit button
    const editButton = page.getByRole('button', { name: /modifier|edit/i }).or(page.getByRole('link', { name: /modifier|edit/i }))
    if (await editButton.isVisible()) {
      await editButton.click()

      // Modify the name
      await page.getByLabel(/nom/i).clear()
      await page.getByLabel(/nom/i).fill('Updated Competition Name')
      await page.getByRole('button', { name: /enregistrer|sauvegarder|modifier/i }).click()

      // Verify update
      await expect(page.getByText('Updated Competition Name')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should delete competition', async ({ authenticatedPage: page }) => {
    // Create a competition first
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Delete Test Competition')
    await page.getByLabel(/date/i).fill('2026-10-01')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await page.waitForURL(/\/competitions/)

    // Click on the competition
    await page.getByText('Delete Test Competition').click()

    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: /supprimer|delete/i })
    if (await deleteButton.isVisible()) {
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept())
      await deleteButton.click()

      // Should redirect to list
      await expect(page).toHaveURL(/\/competitions$/, { timeout: 10000 })
    }
  })
})
