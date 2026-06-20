import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/config/database.js'
import { hashPassword } from '../src/utils/password.js'

export interface TestUser {
  id: number
  email: string
  accessToken: string
  refreshToken: string
}

export async function createTestUser(email = 'testuser@example.com'): Promise<TestUser> {
  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword('testpassword'),
      firstName: 'Test',
      lastName: 'User',
    },
  })

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'testpassword' })

  const cookies = loginRes.headers['set-cookie']
  const refreshTokenCookie = Array.isArray(cookies)
    ? cookies.find((c: string) => c.startsWith('refreshToken='))
    : cookies?.startsWith('refreshToken=') ? cookies : undefined

  return {
    id: user.id,
    email: user.email,
    accessToken: loginRes.body.accessToken,
    refreshToken: refreshTokenCookie || '',
  }
}

export async function createTestCompetition(userId: number, data?: Partial<{
  name: string
  date: Date
  type: string
  subType: string
  priority: string
}>) {
  return prisma.competition.create({
    data: {
      userId,
      name: data?.name || 'Test Competition',
      date: data?.date || new Date('2026-06-15'),
      type: data?.type || 'triathlon',
      subType: data?.subType || 'sprint',
      priority: data?.priority || 'A',
    },
  })
}

export async function createTestPlan(userId: number, data?: Partial<{
  name: string
  targetType: string
  durationWeeks: number
  isTemplate: boolean
}>) {
  return prisma.trainingPlan.create({
    data: {
      userId,
      name: data?.name || 'Test Plan',
      targetType: data?.targetType || 'sprint',
      durationWeeks: data?.durationWeeks || 8,
      isTemplate: data?.isTemplate || false,
    },
  })
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}
