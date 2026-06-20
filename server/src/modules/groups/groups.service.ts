import prisma from '../../config/database.js'

export async function getCoachClub(coachId: number) {
  const membership = await prisma.clubMember.findFirst({
    where: { userId: coachId, role: 'coach' },
    include: { club: true },
  })
  return membership?.club ?? null
}

export async function listGroups(coachId: number) {
  const club = await getCoachClub(coachId)
  if (!club) return []

  const groups = await prisma.trainingGroup.findMany({
    where: { clubId: club.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get current TSB for each member
  const result = await Promise.all(
    groups.map(async (group) => {
      const membersWithTSB = await Promise.all(
        group.members.map(async (m) => {
          // Get latest training load for TSB
          const latestLoad = await prisma.trainingSession.findMany({
            where: {
              plan: { userId: m.userId },
              completed: true,
              date: { gte: new Date(Date.now() - 42 * 24 * 3600 * 1000) },
            },
            orderBy: { date: 'desc' },
            take: 42,
          })
          // Simple TSB approximation: positive if recent load < historical avg
          const recentSessions = latestLoad.filter(
            (s) => s.date && new Date(s.date) >= new Date(Date.now() - 7 * 24 * 3600 * 1000),
          ).length
          const avgSessions = latestLoad.length / 6 // avg per week over 6 weeks
          const tsb = Math.round((avgSessions - recentSessions) * 3 - 2)

          return {
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            currentTSB: tsb,
          }
        }),
      )
      return {
        id: group.id,
        name: group.name,
        level: group.level,
        description: group.description,
        icon: group.icon,
        color: group.color,
        weeklyHours: group.weeklyHours,
        sessionsPerWeek: group.sessionsPerWeek,
        members: membersWithTSB,
      }
    }),
  )
  return result
}

export async function createGroup(
  coachId: number,
  data: {
    name: string
    level: string
    description?: string
    icon?: string
    color?: string
    weeklyHours?: number
    sessionsPerWeek?: number
  },
) {
  const club = await getCoachClub(coachId)
  if (!club) throw new Error('Club introuvable pour ce coach')

  return prisma.trainingGroup.create({
    data: {
      clubId: club.id,
      name: data.name,
      level: data.level,
      description: data.description,
      icon: data.icon,
      color: data.color,
      weeklyHours: data.weeklyHours ?? 5,
      sessionsPerWeek: data.sessionsPerWeek ?? 4,
    },
  })
}

export async function addMember(groupId: number, userId: number) {
  return prisma.trainingGroupMember.create({
    data: { groupId, userId },
  })
}

export async function removeMember(groupId: number, userId: number) {
  return prisma.trainingGroupMember.deleteMany({
    where: { groupId, userId },
  })
}

export async function getGroupStats(coachId: number) {
  const club = await getCoachClub(coachId)
  if (!club) {
    return {
      athleteCount: 0,
      weeklyAttendance: 84,
      plansSent: 0,
      nextCompetitionName: null,
      nextCompetitionDays: null,
    }
  }

  const members = await prisma.clubMember.findMany({
    where: { clubId: club.id, role: 'athlete' },
  })
  const athleteCount = members.length

  // Plans sent this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const plansSent = await prisma.coachPlanSuggestion.count({
    where: {
      coachId,
      sentAt: { gte: weekStart },
    },
  })

  // Next competition among all athletes
  const athleteIds = members.map((m) => m.userId)
  const nextComp = await prisma.competition.findFirst({
    where: {
      userId: { in: athleteIds },
      date: { gte: new Date() },
      status: { not: 'completed' },
    },
    orderBy: { date: 'asc' },
  })

  const nextDays = nextComp
    ? Math.ceil((new Date(nextComp.date).getTime() - Date.now()) / 86400000)
    : null

  return {
    athleteCount,
    weeklyAttendance: 84, // Placeholder - would need complex session tracking
    plansSent,
    nextCompetitionName: nextComp?.name ?? null,
    nextCompetitionDays: nextDays,
  }
}
