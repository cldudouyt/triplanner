// IMPORTANT: Set env vars BEFORE any imports
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/triplan_test'
}
if (!process.env.ACCESS_TOKEN_SECRET) process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
if (!process.env.REFRESH_TOKEN_SECRET) process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'

import { beforeAll, afterAll, beforeEach } from 'vitest'
import prisma from '../src/config/database.js'

export { prisma }

// Tables in dependency order (leaf → root) for truncation
const ALL_TABLES = [
  'Message', 'MessageThread',
  'TrainingGroupMember', 'TrainingGroup',
  'ClubMember', 'Club',
  'CoachPlanSuggestion',
  'UserAchievement', 'PersonalRecord',
  'SeasonGoal',
  'WellnessLog',
  'PlanCompetition', 'TrainingSession', 'TrainingPlan',
  'EquipmentItem', 'Competition',
  'StravaConnection', 'NotificationPreferences',
  'RefreshToken', 'PasswordResetCode',
  'User',
]

async function cleanDatabase() {
  const tableList = ALL_TABLES.map(t => `"${t}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`)
}

beforeAll(async () => {
  await cleanDatabase()
})

beforeEach(async () => {
  await cleanDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
})
