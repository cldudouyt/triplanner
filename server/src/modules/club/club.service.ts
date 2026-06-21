import prisma from '../../config/database.js'
import { generateCoachSuggestions } from '../ai/ai.service.js'
import { getTrainingLoad } from '../statistics/statistics.service.js'

export async function getClubInfo(userId: number) {
  const membership = await prisma.clubMember.findFirst({
    where: { userId },
    include: {
      club: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      },
    },
  })

  if (!membership) return null

  return {
    club: membership.club,
    role: membership.role,
  }
}

export async function getRoster(coachId: number) {
  // Verify the user is a coach
  const coachMembership = await prisma.clubMember.findFirst({
    where: { userId: coachId, role: 'coach' },
  })

  if (!coachMembership) return null

  // Get all athletes in the same club
  const athletes = await prisma.clubMember.findMany({
    where: { clubId: coachMembership.clubId, role: 'athlete' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  // Get current week number (ISO week)
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  // For each athlete, get approximate CTL/TSB and current week suggestion status
  const roster = await Promise.all(
    athletes.map(async (member) => {
      const athleteId = member.userId

      // Get recent wellness logs to approximate CTL/TSB
      const wellnessLogs = await prisma.wellnessLog.findMany({
        where: { userId: athleteId },
        orderBy: { date: 'desc' },
        take: 42, // ~6 weeks for CTL
        select: { readinessScore: true, date: true },
      })

      // Simple CTL/TSB approximation from readiness scores
      let ctl = 0
      let tsb = 0

      if (wellnessLogs.length > 0) {
        const recent7 = wellnessLogs.slice(0, 7)
        const older = wellnessLogs.slice(0, 42)

        const atl = recent7.length > 0
          ? recent7.reduce((sum, log) => sum + log.readinessScore, 0) / recent7.length
          : 0

        ctl = older.length > 0
          ? older.reduce((sum, log) => sum + log.readinessScore, 0) / older.length
          : 0

        tsb = ctl - atl
      }

      // Get current suggestion status
      const currentSuggestion = await prisma.coachPlanSuggestion.findFirst({
        where: { coachId, athleteId, weekNumber: currentWeek },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, weekNumber: true },
      })

      return {
        id: athleteId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        role: member.role,
        ctl: Math.round(ctl),
        tsb: Math.round(tsb),
        currentSuggestion: currentSuggestion ?? null,
      }
    })
  )

  return roster
}

export async function generateSuggestions(
  coachId: number,
  athleteId: number,
  planId: number,
  weekNumber: number
) {
  // Verify coach is in the same club as the athlete
  const coachMembership = await prisma.clubMember.findFirst({
    where: { userId: coachId, role: 'coach' },
  })

  if (!coachMembership) return null

  const athleteMembership = await prisma.clubMember.findFirst({
    where: { userId: athleteId, clubId: coachMembership.clubId },
  })

  if (!athleteMembership) return null

  // Fetch athlete context for AI
  const [athlete, plan, loadPoints, recentWellness, nextComp] = await Promise.all([
    prisma.user.findUnique({ where: { id: athleteId }, select: { firstName: true, lastName: true } }),
    prisma.trainingPlan.findUnique({ where: { id: planId }, select: { name: true } }),
    getTrainingLoad(athleteId, 42).catch(() => []),
    prisma.wellnessLog.findFirst({
      where: { userId: athleteId },
      orderBy: { date: 'desc' },
      select: { fatigue: true, readinessScore: true },
    }),
    prisma.competition.findFirst({
      where: { userId: athleteId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      select: { name: true, date: true },
    }),
  ])

  const latestLoad = loadPoints[loadPoints.length - 1]

  const aiSuggestions = await generateCoachSuggestions({
    athleteName: athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Athlète',
    planName: plan?.name ?? 'Plan',
    weekNumber,
    ctl: latestLoad?.ctl ?? 0,
    tsb: latestLoad?.tsb ?? 0,
    recentWellness: recentWellness ?? undefined,
    nextCompetition: nextComp
      ? { name: nextComp.name, daysUntil: Math.ceil((nextComp.date.getTime() - Date.now()) / 86400000) }
      : undefined,
  })

  const suggestion = await prisma.coachPlanSuggestion.create({
    data: {
      coachId,
      athleteId,
      planId,
      weekNumber,
      suggestions: JSON.stringify(aiSuggestions),
      status: 'draft',
    },
  })

  return {
    ...suggestion,
    suggestions: aiSuggestions,
  }
}

export async function sendPlan(
  coachId: number,
  suggestionId: number,
  appliedIds: string[],
  coachNote?: string
) {
  const suggestion = await prisma.coachPlanSuggestion.findFirst({
    where: { id: suggestionId, coachId },
  })

  if (!suggestion) return null

  // Filter suggestions to only include applied ones
  const allSuggestions = JSON.parse(suggestion.suggestions) as Array<{ id: string; [key: string]: unknown }>
  const filtered = allSuggestions.map((s) => ({ ...s, enabled: appliedIds.includes(s.id) }))

  const updated = await prisma.coachPlanSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      suggestions: JSON.stringify(filtered),
      coachNote: coachNote ?? suggestion.coachNote,
    },
  })

  return {
    ...updated,
    suggestions: JSON.parse(updated.suggestions),
  }
}

export async function respondToPlan(
  athleteId: number,
  suggestionId: number,
  action: 'accept' | 'reject'
) {
  const suggestion = await prisma.coachPlanSuggestion.findFirst({
    where: { id: suggestionId, athleteId },
  })

  if (!suggestion) return null

  const updated = await prisma.coachPlanSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: action === 'accept' ? 'accepted' : 'rejected',
      respondedAt: new Date(),
    },
  })

  return {
    ...updated,
    suggestions: JSON.parse(updated.suggestions),
  }
}

export async function getClubDirectory(userId: number, group?: string) {
  const membership = await prisma.clubMember.findFirst({ where: { userId } })
  if (!membership) return null

  const members = await prisma.clubMember.findMany({
    where: { clubId: membership.clubId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          groupMemberships: {
            include: { group: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const result = members
    .filter(m => !group || m.user.groupMemberships[0]?.group?.name === group)
    .map(m => ({
      id: m.userId,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      role: m.role,
      group: m.user.groupMemberships[0]?.group?.name ?? null,
      isMe: m.userId === userId,
    }))

  return result
}

export async function getAthletePlan(athleteId: number) {
  // Get active training plan
  const now = new Date()
  const plan = await prisma.trainingPlan.findFirst({
    where: {
      userId: athleteId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      sessions: {
        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
      },
    },
  })

  // Get current week's sent suggestion
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  const currentSuggestion = plan
    ? await prisma.coachPlanSuggestion.findFirst({
        where: { athleteId, planId: plan.id, weekNumber: currentWeek, status: 'sent' },
        orderBy: { sentAt: 'desc' },
      })
    : null

  return {
    plan: plan ?? null,
    currentSuggestion: currentSuggestion
      ? { ...currentSuggestion, suggestions: JSON.parse(currentSuggestion.suggestions) }
      : null,
  }
}
