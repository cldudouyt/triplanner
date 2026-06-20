import prisma from '../../config/database.js'

const MOCK_SUGGESTIONS = [
  { id: 'reduce_volume', title: 'Charge hebdo allégée', delta: '−30 min', why: 'Forme en baisse, récup prioritaire', enabled: true },
  { id: 'focus_swim', title: 'Focus natation', delta: '+15 min', why: 'Point de progression identifié', enabled: true },
  { id: 'extra_recovery', title: 'Récup renforcée', delta: '+1 séance', why: 'Charge cumulée élevée', enabled: false },
  { id: 'sync_phys', title: 'Synchro prépa physique', delta: '3 séances', why: 'Julie B. confirmée', enabled: true },
]

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

  const suggestion = await prisma.coachPlanSuggestion.create({
    data: {
      coachId,
      athleteId,
      planId,
      weekNumber,
      suggestions: JSON.stringify(MOCK_SUGGESTIONS),
      status: 'draft',
    },
  })

  return {
    ...suggestion,
    suggestions: JSON.parse(suggestion.suggestions) as typeof MOCK_SUGGESTIONS,
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
