import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register')

      await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()
      await expect(page.getByLabel(/prénom/i)).toBeVisible()
      await expect(page.getByLabel('Nom', { exact: true })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/register')

      await page.getByRole('button', { name: /s'inscrire/i }).click()

      await expect(page.getByText(/requis/i).first()).toBeVisible()
    })

    test('should register a new user', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`

      await page.goto('/register')

      await page.getByLabel(/prénom/i).fill('Jean')
      await page.getByLabel('Nom', { exact: true }).fill('Dupont')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/mot de passe/i).fill('password123')

      await page.getByRole('button', { name: /s'inscrire/i }).click()

      // Should redirect to login after registration
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })
  })

  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('invalid@example.com')
      await page.getByLabel(/mot de passe/i).fill('wrongpassword')

      await page.getByRole('button', { name: /se connecter/i }).click()

      await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: /s'inscrire/i }).click()

      await expect(page).toHaveURL(/\/register/)
    })

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: /mot de passe oublié/i }).click()

      await expect(page).toHaveURL(/\/forgot-password/)
    })
  })

  test.describe('Protected routes', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/competitions')

      await expect(page).toHaveURL(/\/login/)
    })

    test('should redirect to login when accessing training plans', async ({ page }) => {
      await page.goto('/training')

      await expect(page).toHaveURL(/\/login/)
    })
  })
})
