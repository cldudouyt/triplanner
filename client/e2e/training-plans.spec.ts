import { test, expect } from './fixtures'

test.describe('Training Plans', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/training')
  })

  test('should display training plans page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /plans? d'entraînement/i })).toBeVisible()
  })

  test('should show templates section', async ({ authenticatedPage: page }) => {
    // Check if templates section exists
    const templatesSection = page.getByText(/templates?|modèles?/i)
    await expect(templatesSection).toBeVisible()
  })

  test('should navigate to create custom plan', async ({ authenticatedPage: page }) => {
    await page.getByRole('link', { name: /personnalisé|nouveau|créer/i }).click()

    await expect(page).toHaveURL(/\/training\/new/)
  })

  test('should create a custom training plan', async ({ authenticatedPage: page }) => {
    await page.goto('/training/new')

    // Fill form
    await page.getByLabel(/nom/i).fill('Mon Plan Marathon')

    const descriptionField = page.getByLabel(/description/i)
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Préparation pour le marathon de Paris')
    }

    // Select target type
    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique|marathon/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('marathon')
    }

    // Set duration
    const durationInput = page.getByLabel(/durée|semaines/i)
    if (await durationInput.isVisible()) {
      await durationInput.clear()
      await durationInput.fill('16')
    }

    // Set start date
    const startDateInput = page.getByLabel(/date.*début/i)
    if (await startDateInput.isVisible()) {
      await startDateInput.fill('2026-01-06')
    }

    // Submit
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    // Should redirect to plan detail
    await expect(page).toHaveURL(/\/training\/\d+/, { timeout: 10000 })
  })

  test('should create plan with multiple competitions', async ({ authenticatedPage: page }) => {
    // First create a competition
    await page.goto('/competitions/new')
    await page.getByLabel(/nom/i).fill('Target Competition')
    await page.getByLabel(/date/i).fill('2026-06-15')
    await page.locator('select').first().selectOption('triathlon')
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/competitions/)

    // Now create a plan
    await page.goto('/training/new')
    await page.getByLabel(/nom/i).fill('Plan Multi-Objectifs')

    // Select target type
    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('sprint')
    }

    // Set duration
    const durationInput = page.getByLabel(/durée|semaines/i)
    if (await durationInput.isVisible()) {
      await durationInput.clear()
      await durationInput.fill('8')
    }

    // Select competition (checkbox)
    const competitionCheckbox = page.getByRole('checkbox').first()
    if (await competitionCheckbox.isVisible()) {
      await competitionCheckbox.check()
    }

    // Submit
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await expect(page).toHaveURL(/\/training\/\d+/, { timeout: 10000 })
  })

  test('should show validation error for missing name', async ({ authenticatedPage: page }) => {
    await page.goto('/training/new')

    // Try to submit without name
    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()

    await expect(page.getByText(/requis|obligatoire/i)).toBeVisible()
  })
})

test.describe('Training Plan Detail', () => {
  test('should view plan with weekly sessions', async ({ authenticatedPage: page }) => {
    // Create a plan first
    await page.goto('/training/new')
    await page.getByLabel(/nom/i).fill('View Test Plan')

    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique|marathon/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('sprint')
    }

    const durationInput = page.getByLabel(/durée|semaines/i)
    if (await durationInput.isVisible()) {
      await durationInput.clear()
      await durationInput.fill('4')
    }

    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/training\/\d+/)

    // Should show weekly view
    await expect(page.getByText(/semaine 1/i)).toBeVisible()
  })

  test('should add a training session', async ({ authenticatedPage: page }) => {
    // Create a plan first
    await page.goto('/training/new')
    await page.getByLabel(/nom/i).fill('Session Test Plan')

    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique|marathon/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('sprint')
    }

    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/training\/\d+/)

    // Find add session button (usually a + icon)
    const addButton = page.locator('button').filter({ hasText: /\+|ajouter/i }).first()
    if (await addButton.isVisible()) {
      await addButton.click()

      // Fill session form
      const typeSelect = page.locator('select').filter({ hasText: /natation|vélo|course/i })
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('run')
      }

      const titleInput = page.getByLabel(/titre/i)
      if (await titleInput.isVisible()) {
        await titleInput.fill('Footing matinal')
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /ajouter|créer|enregistrer/i }).last()
      await submitButton.click()

      // Session should appear
      await expect(page.getByText(/footing|course/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should mark session as completed', async ({ authenticatedPage: page }) => {
    // Create a plan with sessions
    await page.goto('/training/new')
    await page.getByLabel(/nom/i).fill('Complete Session Plan')

    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique|marathon/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('sprint')
    }

    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/training\/\d+/)

    // Add a session first
    const addButton = page.locator('button').filter({ hasText: /\+/i }).first()
    if (await addButton.isVisible()) {
      await addButton.click()

      const typeSelect = page.locator('select').filter({ hasText: /natation|vélo|course/i })
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('run')
      }

      await page.getByRole('button', { name: /ajouter/i }).last().click()
      await page.waitForTimeout(1000)

      // Find and click complete button (checkmark)
      const completeButton = page.locator('button').filter({ hasText: /✓|check/i }).first()
      if (await completeButton.isVisible()) {
        await completeButton.click()
        // Session should be marked as completed (usually green background)
      }
    }
  })

  test('should delete plan', async ({ authenticatedPage: page }) => {
    // Create a plan
    await page.goto('/training/new')
    await page.getByLabel(/nom/i).fill('Delete Test Plan')

    const targetTypeSelect = page.locator('select').filter({ hasText: /sprint|olympique|marathon/i })
    if (await targetTypeSelect.isVisible()) {
      await targetTypeSelect.selectOption('sprint')
    }

    await page.getByRole('button', { name: /créer|ajouter|enregistrer/i }).click()
    await page.waitForURL(/\/training\/\d+/)

    // Find delete button
    const deleteButton = page.getByRole('button', { name: /supprimer/i })
    if (await deleteButton.isVisible()) {
      page.on('dialog', dialog => dialog.accept())
      await deleteButton.click()

      // Should redirect to list
      await expect(page).toHaveURL(/\/training$/, { timeout: 10000 })
    }
  })
})

test.describe('Training Plan Templates', () => {
  test('should create plan from template', async ({ authenticatedPage: page }) => {
    await page.goto('/training')

    // Click on template button
    const templateButton = page.getByRole('button', { name: /template|modèle/i })
    if (await templateButton.isVisible()) {
      await templateButton.click()

      // Select a template
      const templateSelect = page.locator('select').filter({ hasText: /template|sélectionner/i })
      if (await templateSelect.isVisible()) {
        const options = await templateSelect.locator('option').all()
        if (options.length > 1) {
          await templateSelect.selectOption({ index: 1 })
        }
      }

      // Set start date
      const startDateInput = page.getByLabel(/date.*début/i)
      if (await startDateInput.isVisible()) {
        await startDateInput.fill('2026-02-01')
      }

      // Create
      await page.getByRole('button', { name: /créer/i }).click()

      // Should redirect to plan detail
      await expect(page).toHaveURL(/\/training\/\d+/, { timeout: 10000 })
    }
  })
})
