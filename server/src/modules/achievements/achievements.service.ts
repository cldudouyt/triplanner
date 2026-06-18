import prisma from '../../config/database.js'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'training' | 'consistency' | 'distance' | 'competition' | 'wellness'
  threshold: number
  unit: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Training milestones
  { id: 'first_session', name: 'Premier pas', description: 'Complétez votre première séance', icon: '🎯', category: 'training', threshold: 1, unit: 'sessions' },
  { id: 'sessions_10', name: 'En route', description: 'Complétez 10 séances', icon: '🏋️', category: 'training', threshold: 10, unit: 'sessions' },
  { id: 'sessions_50', name: 'Athlète confirmé', description: 'Complétez 50 séances', icon: '💪', category: 'training', threshold: 50, unit: 'sessions' },
  { id: 'sessions_100', name: 'Centurion', description: 'Complétez 100 séances', icon: '🏅', category: 'training', threshold: 100, unit: 'sessions' },
  { id: 'sessions_250', name: 'Machine', description: 'Complétez 250 séances', icon: '⚡', category: 'training', threshold: 250, unit: 'sessions' },

  // Consistency streaks
  { id: 'streak_7', name: 'Semaine parfaite', description: 'Maintenez une série de 7 jours', icon: '🔥', category: 'consistency', threshold: 7, unit: 'days' },
  { id: 'streak_14', name: 'Deux semaines', description: 'Maintenez une série de 14 jours', icon: '🔥', category: 'consistency', threshold: 14, unit: 'days' },
  { id: 'streak_30', name: 'Mois complet', description: 'Maintenez une série de 30 jours', icon: '🌟', category: 'consistency', threshold: 30, unit: 'days' },
  { id: 'streak_90', name: 'Trimestre de fer', description: 'Maintenez une série de 90 jours', icon: '👑', category: 'consistency', threshold: 90, unit: 'days' },

  // Distance milestones
  { id: 'run_100k', name: 'Coureur 100K', description: 'Courez un total de 100 km', icon: '🏃', category: 'distance', threshold: 100, unit: 'km_run' },
  { id: 'run_500k', name: 'Coureur 500K', description: 'Courez un total de 500 km', icon: '🏃', category: 'distance', threshold: 500, unit: 'km_run' },
  { id: 'run_1000k', name: 'Millionnaire', description: 'Courez un total de 1000 km', icon: '🏃', category: 'distance', threshold: 1000, unit: 'km_run' },
  { id: 'bike_500k', name: 'Cycliste 500K', description: 'Pédalez un total de 500 km', icon: '🚴', category: 'distance', threshold: 500, unit: 'km_bike' },
  { id: 'bike_2000k', name: 'Tour de France', description: 'Pédalez un total de 2000 km', icon: '🚴', category: 'distance', threshold: 2000, unit: 'km_bike' },
  { id: 'swim_50k', name: 'Nageur 50K', description: 'Nagez un total de 50 km', icon: '🏊', category: 'distance', threshold: 50, unit: 'km_swim' },
  { id: 'swim_100k', name: 'Traversée', description: 'Nagez un total de 100 km', icon: '🏊', category: 'distance', threshold: 100, unit: 'km_swim' },

  // Competition achievements
  { id: 'first_race', name: 'Baptême du feu', description: 'Terminez votre première compétition', icon: '🏁', category: 'competition', threshold: 1, unit: 'races' },
  { id: 'races_5', name: 'Compétiteur', description: 'Terminez 5 compétitions', icon: '🏆', category: 'competition', threshold: 5, unit: 'races' },
  { id: 'races_10', name: 'Vétéran', description: 'Terminez 10 compétitions', icon: '🥇', category: 'competition', threshold: 10, unit: 'races' },
  { id: 'first_triathlon', name: 'Triathlète', description: 'Terminez votre premier triathlon', icon: '🔱', category: 'competition', threshold: 1, unit: 'triathlons' },
  { id: 'ironman', name: 'Ironman', description: 'Terminez un Ironman', icon: '🦾', category: 'competition', threshold: 1, unit: 'ironman' },

  // Wellness
  { id: 'wellness_7', name: 'Self-care', description: 'Remplissez 7 check-ins bien-être', icon: '💚', category: 'wellness', threshold: 7, unit: 'checkins' },
  { id: 'wellness_30', name: 'Conscience corporelle', description: 'Remplissez 30 check-ins bien-être', icon: '🧘', category: 'wellness', threshold: 30, unit: 'checkins' },
]

export async function checkAndUnlockAchievements(userId: number) {
  const [
    sessions,
    competitions,
    wellnessLogs,
    existingAchievements,
  ] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { plan: { userId }, completed: true },
      select: { type: true, actualDistance: true, distance: true, date: true },
      orderBy: { date: 'desc' },
    }),
    prisma.competition.findMany({
      where: { userId, status: 'completed' },
      select: { type: true, subType: true },
    }),
    prisma.wellnessLog.count({ where: { userId } }),
    prisma.userAchievement.findMany({ where: { userId } }),
  ])

  const unlockedIds = new Set(existingAchievements.map(a => a.achievementId))
  const newUnlocks: string[] = []

  // Calculate metrics
  const totalSessions = sessions.length
  let totalRunKm = 0
  let totalBikeKm = 0
  let totalSwimKm = 0

  for (const s of sessions) {
    const dist = s.actualDistance || s.distance || 0
    if (s.type === 'run') totalRunKm += dist
    else if (s.type === 'bike') totalBikeKm += dist
    else if (s.type === 'swim') totalSwimKm += dist
  }

  // Calculate streak
  let longestStreak = 0
  let streak = 0
  let lastDate: Date | null = null
  const completedDates = sessions
    .filter(s => s.date)
    .map(s => s.date!)
    .sort((a, b) => b.getTime() - a.getTime())

  for (const date of completedDates) {
    if (!lastDate) { streak = 1; lastDate = date; continue }
    const diffDays = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 2) { streak++ } else { longestStreak = Math.max(longestStreak, streak); streak = 1 }
    lastDate = date
  }
  longestStreak = Math.max(longestStreak, streak)

  const totalRaces = competitions.length
  const triathlons = competitions.filter(c => c.type === 'triathlon').length
  const ironmans = competitions.filter(c => c.type === 'triathlon' && (c.subType === 'ironman')).length

  // Check each achievement
  const metrics: Record<string, number> = {
    sessions: totalSessions,
    days: longestStreak,
    km_run: totalRunKm,
    km_bike: totalBikeKm,
    km_swim: totalSwimKm,
    races: totalRaces,
    triathlons,
    ironman: ironmans,
    checkins: wellnessLogs,
  }

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue

    const currentValue = metrics[achievement.unit] || 0
    const progress = Math.min(100, Math.round((currentValue / achievement.threshold) * 100))

    if (currentValue >= achievement.threshold) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
        update: { progress: 100 },
        create: { userId, achievementId: achievement.id, progress: 100 },
      })
      newUnlocks.push(achievement.id)
    } else if (progress >= 25) {
      // Track partial progress for achievements at 25%+
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
        update: { progress },
        create: { userId, achievementId: achievement.id, progress },
      })
    }
  }

  return { newUnlocks, metrics }
}

export async function getUserAchievements(userId: number) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
  })

  const achievementMap = new Map(userAchievements.map(a => [a.achievementId, a]))

  return ACHIEVEMENTS.map(def => {
    const userAch = achievementMap.get(def.id)
    return {
      ...def,
      unlocked: userAch?.progress === 100,
      progress: userAch?.progress || 0,
      unlockedAt: userAch?.progress === 100 ? userAch.unlockedAt : null,
    }
  })
}
