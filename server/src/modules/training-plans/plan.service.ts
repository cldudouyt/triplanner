import prisma from '../../config/database.js'
import crypto from 'node:crypto'
import type { CreatePlanInput, UpdatePlanInput } from './plan.schema.js'
import { generateSessionsForPlan } from './session-generator.js'

export interface PlanQuery {
  page?: number
  limit?: number
}

export async function findAll(userId: number, query: PlanQuery = {}) {
  const page = query.page || 1
  const limit = query.limit || 50

  const [data, total] = await Promise.all([
    prisma.trainingPlan.findMany({
      where: { userId, isTemplate: false },
      include: {
        competitions: {
          include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trainingPlan.count({ where: { userId, isTemplate: false } }),
  ])

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function findTemplates() {
  return prisma.trainingPlan.findMany({
    where: { isTemplate: true },
    include: { _count: { select: { sessions: true } } },
    orderBy: { targetType: 'asc' },
  })
}

export async function findById(userId: number, id: number) {
  return prisma.trainingPlan.findFirst({
    where: {
      id,
      OR: [{ userId }, { isTemplate: true }],
    },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })
}

export async function findActive(userId: number) {
  const now = new Date()
  // Plan en cours (startDate passée, endDate future)
  let plan = await prisma.trainingPlan.findFirst({
    where: {
      userId,
      isTemplate: false,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })

  // Fallback : plan le plus récent si aucun "en cours"
  if (!plan) {
    plan = await prisma.trainingPlan.findFirst({
      where: { userId, isTemplate: false },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
        competitions: {
          include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
      },
    })
  }

  if (!plan) return null

  // Calcul de la semaine courante dans le plan
  let currentWeek = 1
  let totalWeeks = plan.durationWeeks ?? 1
  if (plan.startDate) {
    const diffMs = now.getTime() - new Date(plan.startDate).getTime()
    currentWeek = Math.max(1, Math.min(Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)), totalWeeks))
  }

  return { ...plan, currentWeek, totalWeeks }
}

export async function create(userId: number, input: CreatePlanInput) {
  const endDate = input.startDate
    ? new Date(new Date(input.startDate).getTime() + input.durationWeeks * 7 * 24 * 60 * 60 * 1000)
    : undefined

  const { competitionIds, autoGenerate, ...planData } = input

  const plan = await prisma.trainingPlan.create({
    data: {
      ...planData,
      userId,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate,
    },
  })

  if (competitionIds?.length) {
    await prisma.planCompetition.createMany({
      data: competitionIds.map((c, i) => ({
        planId: plan.id,
        competitionId: c.id,
        isPrimary: c.isPrimary ?? (i === 0),
        order: i,
      })),
    })
  }

  // Auto-generate sessions if requested and start date is provided
  if (autoGenerate && input.startDate) {
    await generateSessionsForPlan(
      plan.id,
      input.targetType,
      input.durationWeeks,
      new Date(input.startDate),
      (input.level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate'
    )
  }

  return prisma.trainingPlan.findUnique({
    where: { id: plan.id },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })
}

export async function createFromTemplate(
  userId: number,
  templateId: number,
  competitionIds: Array<{ id: number; isPrimary?: boolean }> | undefined,
  startDate: Date
) {
  const template = await prisma.trainingPlan.findFirst({
    where: { id: templateId, isTemplate: true },
    include: { sessions: true },
  })

  if (!template) return null

  const endDate = new Date(startDate.getTime() + template.durationWeeks * 7 * 24 * 60 * 60 * 1000)

  const plan = await prisma.trainingPlan.create({
    data: {
      name: template.name,
      description: template.description,
      targetType: template.targetType,
      durationWeeks: template.durationWeeks,
      userId,
      startDate,
      endDate,
      isTemplate: false,
    },
  })

  if (competitionIds?.length) {
    await prisma.planCompetition.createMany({
      data: competitionIds.map((c, i) => ({
        planId: plan.id,
        competitionId: c.id,
        isPrimary: c.isPrimary ?? (i === 0),
        order: i,
      })),
    })
  }

  // Clone sessions with computed dates
  const sessions = template.sessions.map(s => {
    const sessionDate = new Date(startDate)
    sessionDate.setDate(sessionDate.getDate() + (s.weekNumber - 1) * 7 + (s.dayOfWeek - 1))

    return {
      planId: plan.id,
      weekNumber: s.weekNumber,
      dayOfWeek: s.dayOfWeek,
      date: sessionDate,
      type: s.type,
      title: s.title,
      description: s.description,
      duration: s.duration,
      distance: s.distance,
      intensity: s.intensity,
    }
  })

  await prisma.trainingSession.createMany({ data: sessions })

  return prisma.trainingPlan.findUnique({
    where: { id: plan.id },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })
}

export async function update(userId: number, id: number, input: UpdatePlanInput) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id, userId } })
  if (!plan) return null

  const { competitionIds, ...planData } = input

  await prisma.trainingPlan.update({
    where: { id },
    data: planData,
  })

  if (competitionIds !== undefined) {
    await prisma.planCompetition.deleteMany({ where: { planId: id } })
    if (competitionIds.length) {
      await prisma.planCompetition.createMany({
        data: competitionIds.map((c, i) => ({
          planId: id,
          competitionId: c.id,
          isPrimary: c.isPrimary ?? (i === 0),
          order: i,
        })),
      })
    }
  }

  return prisma.trainingPlan.findUnique({
    where: { id },
    include: {
      sessions: true,
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })
}

export async function remove(userId: number, id: number) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id, userId } })
  if (!plan) return false

  await prisma.trainingPlan.delete({ where: { id } })
  return true
}

export async function generateSessions(userId: number, id: number) {
  const plan = await prisma.trainingPlan.findFirst({
    where: { id, userId },
    select: { id: true, targetType: true, durationWeeks: true, startDate: true, level: true },
  })

  if (!plan) return null
  if (!plan.startDate) {
    throw new Error('START_DATE_REQUIRED')
  }

  const sessionCount = await generateSessionsForPlan(
    plan.id,
    plan.targetType,
    plan.durationWeeks,
    plan.startDate,
    (plan.level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate'
  )

  return {
    planId: plan.id,
    sessionsGenerated: sessionCount,
  }
}

export async function sharePlan(userId: number, id: number) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id, userId } })
  if (!plan) return null

  const shareCode = crypto.randomBytes(8).toString('hex')

  return prisma.trainingPlan.update({
    where: { id },
    data: { isPublic: true, shareCode },
    select: { id: true, shareCode: true },
  })
}

export async function unsharePlan(userId: number, id: number) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id, userId } })
  if (!plan) return null

  return prisma.trainingPlan.update({
    where: { id },
    data: { isPublic: false, shareCode: null },
    select: { id: true },
  })
}

export async function findByShareCode(shareCode: string) {
  return prisma.trainingPlan.findUnique({
    where: { shareCode },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      user: { select: { firstName: true, lastName: true } },
    },
  })
}

export async function copyPlan(userId: number, sourceId: number) {
  const source = await prisma.trainingPlan.findFirst({
    where: { id: sourceId, isPublic: true },
    include: { sessions: true },
  })

  if (!source) return null

  const plan = await prisma.trainingPlan.create({
    data: {
      name: `${source.name} (copie)`,
      description: source.description,
      targetType: source.targetType,
      durationWeeks: source.durationWeeks,
      userId,
      isTemplate: false,
      isPublic: false,
    },
  })

  // Copy sessions
  if (source.sessions.length > 0) {
    await prisma.trainingSession.createMany({
      data: source.sessions.map(s => ({
        planId: plan.id,
        weekNumber: s.weekNumber,
        dayOfWeek: s.dayOfWeek,
        type: s.type,
        title: s.title,
        description: s.description,
        duration: s.duration,
        distance: s.distance,
        intensity: s.intensity,
      })),
    })
  }

  return prisma.trainingPlan.findUnique({
    where: { id: plan.id },
    include: { sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] } },
  })
}

export async function findPublicPlans(query: PlanQuery = {}) {
  const page = query.page || 1
  const limit = query.limit || 20

  const [data, total] = await Promise.all([
    prisma.trainingPlan.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trainingPlan.count({ where: { isPublic: true } }),
  ])

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ── Sharing v2 ──────────────────────────────────────────────────────────────

function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function sharePlanV2(userId: number, planId: number, makePublic = false) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id: planId, userId } })
  if (!plan) throw new Error('PLAN_NOT_FOUND')
  let shareCode = plan.shareCode
  if (!shareCode) {
    shareCode = generateShareCode()
    while (await prisma.trainingPlan.findUnique({ where: { shareCode } })) {
      shareCode = generateShareCode()
    }
  }
  return prisma.trainingPlan.update({
    where: { id: planId },
    data: { shareCode, isPublic: makePublic },
    include: { sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] } },
  })
}

export async function revokePlanShare(userId: number, planId: number) {
  const plan = await prisma.trainingPlan.findFirst({ where: { id: planId, userId } })
  if (!plan) throw new Error('PLAN_NOT_FOUND')
  return prisma.trainingPlan.update({ where: { id: planId }, data: { shareCode: null, isPublic: false } })
}

export async function getPublicPlan(shareCode: string) {
  const plan = await prisma.trainingPlan.findUnique({
    where: { shareCode },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      user: { select: { firstName: true, lastName: true } },
    },
  })
  if (!plan) throw new Error('PLAN_NOT_FOUND')
  return plan
}

export async function getPublicPlans(filters: { targetType?: string; level?: string } = {}) {
  return prisma.trainingPlan.findMany({
    where: { isPublic: true, shareCode: { not: null }, ...filters },
    include: {
      sessions: { select: { id: true } },
      user: { select: { firstName: true, lastName: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function copyPublicPlan(userId: number, planId: number) {
  const source = await prisma.trainingPlan.findFirst({
    where: { id: planId, isPublic: true },
    include: { sessions: true },
  })
  if (!source) throw new Error('PLAN_NOT_FOUND')
  const copy = await prisma.trainingPlan.create({
    data: {
      userId,
      name: `${source.name} (copie)`,
      targetType: source.targetType,
      durationWeeks: source.durationWeeks,
      level: source.level,
      weeklyHours: source.weeklyHours,
      description: source.description,
    },
  })
  await prisma.trainingSession.createMany({
    data: source.sessions.map(s => ({
      planId: copy.id,
      weekNumber: s.weekNumber,
      dayOfWeek: s.dayOfWeek,
      type: s.type,
      title: s.title,
      description: s.description,
      duration: s.duration,
      distance: s.distance,
      intensity: s.intensity,
      completed: false,
    })),
  })
  return prisma.trainingPlan.findUnique({
    where: { id: copy.id },
    include: { sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] } },
  })
}
