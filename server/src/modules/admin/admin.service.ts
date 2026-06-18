import prisma from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'

export async function getDashboardStats() {
  const [
    usersCount,
    plansCount,
    competitionsCount,
    sessionsCount,
    recentUsers,
    recentPlans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.trainingPlan.count(),
    prisma.competition.count(),
    prisma.trainingSession.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    }),
    prisma.trainingPlan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ])

  const usersThisMonth = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  })

  const activeUsers = await prisma.trainingSession.groupBy({
    by: ['planId'],
    where: {
      updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    _count: true,
  })

  return {
    stats: {
      users: usersCount,
      plans: plansCount,
      competitions: competitionsCount,
      sessions: sessionsCount,
      usersThisMonth,
      activeUsersLast7Days: activeUsers.length,
    },
    recentUsers,
    recentPlans,
  }
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'email' | 'firstName'
  sortOrder?: 'asc' | 'desc'
}

export async function listUsers(params: UserListParams) {
  const page = params.page || 1
  const limit = params.limit || 20
  const skip = (page - 1) * limit

  const buildSearchWhere = (search: string) => {
    const words = search.trim().split(/\s+/).filter(Boolean)
    const conditions: object[] = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
    if (words.length > 1) {
      for (const word of words) {
        conditions.push({ firstName: { contains: word } })
        conditions.push({ lastName: { contains: word } })
      }
    }
    return { OR: conditions }
  }

  const where = params.search ? buildSearchWhere(params.search) : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            trainingPlans: true,
            competitions: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          trainingPlans: true,
          competitions: true,
          refreshTokens: true,
        },
      },
      trainingPlans: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, targetType: true, createdAt: true },
      },
      competitions: {
        take: 10,
        orderBy: { date: 'desc' },
        select: { id: true, name: true, date: true, type: true },
      },
    },
  })
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  email?: string
  isAdmin?: boolean
  password?: string
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const data: Record<string, unknown> = {}

  if (input.firstName !== undefined) data.firstName = input.firstName
  if (input.lastName !== undefined) data.lastName = input.lastName
  if (input.email !== undefined) data.email = input.email
  if (input.isAdmin !== undefined) data.isAdmin = input.isAdmin
  if (input.password) data.password = await hashPassword(input.password)

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function deleteUser(id: number, currentUserId: number) {
  if (id === currentUserId) {
    throw new Error('CANNOT_DELETE_SELF')
  }

  await prisma.user.delete({ where: { id } })
}

export interface ContentListParams {
  page?: number
  limit?: number
  type?: 'plans' | 'competitions'
  search?: string
}

export async function listContent(params: ContentListParams) {
  const page = params.page || 1
  const limit = params.limit || 20
  const skip = (page - 1) * limit

  if (params.type === 'competitions') {
    const where = params.search
      ? { name: { contains: params.search } }
      : {}

    const [data, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.competition.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  // Default: plans
  const where = params.search
    ? { name: { contains: params.search } }
    : {}

  const [data, total] = await Promise.all([
    prisma.trainingPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.trainingPlan.count({ where }),
  ])

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function deleteContent(type: 'plan' | 'competition', id: number) {
  if (type === 'competition') {
    await prisma.competition.delete({ where: { id } })
  } else {
    await prisma.trainingPlan.delete({ where: { id } })
  }
}

export async function getSystemLogs() {
  // Simple activity log based on recent changes
  const [recentSessions, recentCompetitions, recentUsers] = await Promise.all([
    prisma.trainingSession.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        plan: {
          select: {
            name: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    prisma.competition.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, createdAt: true },
    }),
  ])

  return {
    recentSessionActivity: recentSessions,
    recentCompetitionActivity: recentCompetitions,
    recentRegistrations: recentUsers,
  }
}
