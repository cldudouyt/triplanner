// IMPORTANT: Set env vars BEFORE any imports
process.env.DATABASE_URL = 'file:./prisma/test.db'
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing'
process.env.NODE_ENV = 'test'

import { beforeAll, afterAll, beforeEach } from 'vitest'
// Import the shared prisma instance from the app
import prisma from '../src/config/database.js'

export { prisma }

beforeAll(async () => {
  // Ensure clean database for tests
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
  // Clean all tables at start
  const tables = ['PlanCompetition', 'TrainingSession', 'TrainingPlan', 'EquipmentItem', 'Competition', 'RefreshToken', 'PasswordResetCode', 'User']
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`)
    } catch {
      // Table might not exist
    }
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
})

beforeEach(async () => {
  // Clean up tables before each test in correct order (respecting foreign keys)
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
  const tables = ['PlanCompetition', 'TrainingSession', 'TrainingPlan', 'EquipmentItem', 'Competition', 'RefreshToken', 'PasswordResetCode', 'User']
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`)
    } catch {
      // Table might not exist in some test scenarios
    }
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
})

afterAll(async () => {
  await prisma.$disconnect()
})
