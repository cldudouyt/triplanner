import { test as base, expect } from '@playwright/test'

// Test user credentials
export const TEST_USER = {
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'testpassword123',
  firstName: 'E2E',
  lastName: 'Tester',
}

// Extended test with authentication
export const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Register user
    await page.goto('/register')
    await page.getByLabel(/prénom/i).fill(TEST_USER.firstName)
    await page.getByLabel('Nom', { exact: true }).fill(TEST_USER.lastName)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /s'inscrire/i }).click()

    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // Login
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Wait for redirect to home/dashboard
    await page.waitForURL(/^\/$|\/competitions|\/training/, { timeout: 10000 })

    await use(page as any)
  },
})

export { expect }

// Helper to login with existing user
export async function loginAs(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(password)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await page.waitForURL(/^\/$|\/competitions|\/training/, { timeout: 10000 })
}

// Helper to create a competition
export async function createCompetition(page: any, name: string, type: string = 'triathlon') {
  await page.goto('/competitions/new')
  await page.getByLabel(/nom/i).fill(name)
  await page.getByLabel(/type/i).selectOption(type)
  if (type === 'triathlon') {
    await page.getByLabel(/distance/i).first().selectOption('sprint')
  } else {
    await page.getByLabel(/distance/i).first().selectOption('10k')
  }
  await page.getByLabel(/date/i).fill('2026-06-15')
  await page.getByRole('button', { name: /créer|ajouter/i }).click()
}
