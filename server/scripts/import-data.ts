import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TARGET_EMAIL = 'cldudouyt@gmail.com'

async function main() {
  // Find user
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } })
  if (!user) {
    console.error(`Utilisateur ${TARGET_EMAIL} introuvable !`)
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } })
    console.log('Utilisateurs existants:', allUsers)
    process.exit(1)
  }
  console.log(`Utilisateur trouvÃ©: ${user.firstName} ${user.lastName} (id: ${user.id})`)

  // =====================================================
  // 1. COMPETITIONS
  // =====================================================
  console.log('\n--- Import des compÃ©titions ---')

  const competitions = [
    {
      name: '10 Km d\'Orvault',
      date: new Date('2026-03-08'),
      location: 'Orvault',
      type: 'running',
      subType: '10k',
      runDistance: 10.0,
      chronoObjective: '00:50:00',
      priority: 'B',
      status: 'registered',
    },
    {
      name: 'Semi-marathon de Nantes',
      date: new Date('2026-04-26'),
      location: 'Nantes',
      type: 'running',
      subType: 'semi-marathon',
      runDistance: 21.1,
      priority: 'A',
      status: 'registered',
    },
    {
      name: 'Triathlon d\'Angers',
      date: new Date('2026-05-16'),
      location: 'Angers',
      type: 'triathlon',
      subType: 'sprint',
      swimDistance: 0.75,
      bikeDistance: 20.0,
      runDistance: 5.0,
      priority: 'B',
      status: 'registered',
    },
    {
      name: 'Triathlon des Sables-d\'Olonne',
      date: new Date('2026-05-17'),
      location: 'Sables-d\'Olonne',
      type: 'triathlon',
      subType: 'sprint',
      swimDistance: 0.75,
      bikeDistance: 20.0,
      runDistance: 5.0,
      priority: 'B',
      status: 'registered',
    },
    {
      name: 'Triathlon de La Roche-sur-Yon',
      date: new Date('2026-05-24'),
      location: 'La Roche-sur-Yon',
      type: 'triathlon',
      subType: 'sprint',
      swimDistance: 0.75,
      bikeDistance: 20.0,
      runDistance: 5.0,
      priority: 'B',
      status: 'registered',
    },
    {
      name: 'Triathlon de Montreuil-JuignÃ©',
      date: new Date('2026-06-07'),
      location: 'Montreuil-JuignÃ©',
      type: 'triathlon',
      subType: 'olympic',
      swimDistance: 1.5,
      bikeDistance: 40.0,
      runDistance: 10.0,
      priority: 'B',
      status: 'registered',
    },
    {
      name: 'Triathlon du Val-AndrÃ©',
      date: new Date('2026-07-04'),
      location: 'PlÃ©neuf Val AndrÃ©',
      type: 'triathlon',
      subType: 'sprint',
      swimDistance: 0.75,
      bikeDistance: 20.0,
      runDistance: 5.0,
      priority: 'C',
      status: 'planned',
    },
    {
      name: 'Semi Cancale - Saint-Malo',
      date: new Date('2026-08-23'),
      location: 'Cancale - Saint-Malo',
      type: 'running',
      subType: 'semi-marathon',
      runDistance: 21.1,
      priority: 'C',
      status: 'planned',
    },
    {
      name: 'Triathlon de Dinard',
      date: new Date('2026-09-13'),
      location: 'Dinard',
      type: 'triathlon',
      subType: 'olympic',
      swimDistance: 1.5,
      bikeDistance: 40.0,
      runDistance: 10.0,
      priority: 'A',
      status: 'registered',
    },
    {
      name: 'Triathlon Audencia La Baule',
      date: new Date('2026-09-19'),
      location: 'La Baule',
      type: 'triathlon',
      subType: 'sprint',
      swimDistance: 0.75,
      bikeDistance: 20.0,
      runDistance: 5.0,
      priority: 'C',
      status: 'planned',
    },
    {
      name: 'Bayman Triathlon',
      date: new Date('2026-10-11'),
      location: null,
      type: 'triathlon',
      subType: 'olympic',
      swimDistance: 1.5,
      bikeDistance: 40.0,
      runDistance: 10.0,
      priority: 'B',
      status: 'registered',
    },
  ]

  for (const comp of competitions) {
    const created = await prisma.competition.create({
      data: {
        userId: user.id,
        name: comp.name,
        date: comp.date,
        location: comp.location,
        type: comp.type,
        subType: comp.subType,
        swimDistance: comp.swimDistance || null,
        bikeDistance: comp.bikeDistance || null,
        runDistance: comp.runDistance || null,
        chronoObjective: comp.chronoObjective || null,
        priority: comp.priority,
        status: comp.status,
      },
    })
    console.log(`  + ${created.name} (id: ${created.id})`)
  }

  // =====================================================
  // 2. PLAN D'ENTRAINEMENT + SESSIONS
  // =====================================================
  console.log('\n--- Import du plan d\'entraÃ®nement ---')

  const plan = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Semi marathon Nantes',
      description: 'Plan de prÃ©paration 12 semaines pour le semi-marathon de Nantes (26 avril 2026). Objectif : terminer en bonne condition.',
      targetType: 'running',
      durationWeeks: 12,
      level: 'intermediate',
      weeklyHours: 5,
      startDate: new Date('2026-02-04'),
      endDate: new Date('2026-04-27'),
    },
  })
  console.log(`  Plan crÃ©Ã©: ${plan.name} (id: ${plan.id})`)

  // Link plan to the semi-marathon competition
  const semiNantes = await prisma.competition.findFirst({
    where: { userId: user.id, name: 'Semi-marathon de Nantes' },
  })
  if (semiNantes) {
    await prisma.planCompetition.create({
      data: { planId: plan.id, competitionId: semiNantes.id, isPrimary: true, order: 0 },
    })
    console.log(`  Plan liÃ© au semi-marathon de Nantes`)
  }

  console.log('\n--- Import des sÃ©ances ---')

  const sessions = [
    // Week 1
    { weekNumber: 1, dayOfWeek: 1, date: '2026-02-04', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 25, distance: 4.2, intensity: 'easy' },
    { weekNumber: 1, dayOfWeek: 2, date: '2026-02-05', type: 'run', title: 'FractionnÃ© court', duration: 35, distance: 6.3, intensity: 'interval' },
    { weekNumber: 1, dayOfWeek: 3, date: '2026-02-06', type: 'strength', title: 'Renforcement / PPG', duration: 28, distance: null, intensity: 'moderate' },
    { weekNumber: 1, dayOfWeek: 5, date: '2026-02-08', type: 'run', title: 'Tempo / Seuil', duration: 39, distance: 7.7, intensity: 'moderate' },
    { weekNumber: 1, dayOfWeek: 7, date: '2026-02-10', type: 'run', title: 'Sortie longue', duration: 56, distance: 9.8, intensity: 'easy' },
    // Week 2
    { weekNumber: 2, dayOfWeek: 1, date: '2026-02-11', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 25, distance: 4.2, intensity: 'easy' },
    { weekNumber: 2, dayOfWeek: 2, date: '2026-02-12', type: 'run', title: 'FractionnÃ© court', duration: 35, distance: 6.3, intensity: 'interval' },
    { weekNumber: 2, dayOfWeek: 3, date: '2026-02-13', type: 'strength', title: 'Renforcement / PPG', duration: 28, distance: null, intensity: 'moderate' },
    { weekNumber: 2, dayOfWeek: 5, date: '2026-02-15', type: 'run', title: 'Tempo / Seuil', duration: 39, distance: 7.7, intensity: 'moderate' },
    { weekNumber: 2, dayOfWeek: 7, date: '2026-02-17', type: 'run', title: 'Sortie longue', duration: 56, distance: 9.8, intensity: 'easy' },
    // Week 3
    { weekNumber: 3, dayOfWeek: 1, date: '2026-02-18', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 25, distance: 4.2, intensity: 'easy' },
    { weekNumber: 3, dayOfWeek: 2, date: '2026-02-19', type: 'run', title: 'FractionnÃ© court', duration: 35, distance: 6.3, intensity: 'interval' },
    { weekNumber: 3, dayOfWeek: 3, date: '2026-02-20', type: 'strength', title: 'Renforcement / PPG', duration: 28, distance: null, intensity: 'moderate' },
    { weekNumber: 3, dayOfWeek: 5, date: '2026-02-22', type: 'run', title: 'Tempo / Seuil', duration: 39, distance: 7.7, intensity: 'moderate' },
    { weekNumber: 3, dayOfWeek: 7, date: '2026-02-24', type: 'run', title: 'Sortie longue', duration: 56, distance: 9.8, intensity: 'easy' },
    // Week 4
    { weekNumber: 4, dayOfWeek: 1, date: '2026-02-25', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 32, distance: 5.4, intensity: 'easy' },
    { weekNumber: 4, dayOfWeek: 2, date: '2026-02-26', type: 'run', title: 'FractionnÃ© court', duration: 45, distance: 8.1, intensity: 'interval' },
    { weekNumber: 4, dayOfWeek: 3, date: '2026-02-27', type: 'strength', title: 'Renforcement / PPG', duration: 36, distance: null, intensity: 'moderate' },
    { weekNumber: 4, dayOfWeek: 5, date: '2026-03-01', type: 'run', title: 'Tempo / Seuil', duration: 50, distance: 9.9, intensity: 'moderate' },
    { weekNumber: 4, dayOfWeek: 7, date: '2026-03-03', type: 'run', title: 'Sortie longue', duration: 72, distance: 12.6, intensity: 'easy' },
    // Week 5
    { weekNumber: 5, dayOfWeek: 1, date: '2026-03-04', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 32, distance: 5.4, intensity: 'easy' },
    { weekNumber: 5, dayOfWeek: 2, date: '2026-03-05', type: 'run', title: 'FractionnÃ© court', duration: 45, distance: 8.1, intensity: 'interval' },
    { weekNumber: 5, dayOfWeek: 3, date: '2026-03-06', type: 'strength', title: 'Renforcement / PPG', duration: 36, distance: null, intensity: 'moderate' },
    { weekNumber: 5, dayOfWeek: 5, date: '2026-03-08', type: 'run', title: 'Tempo / Seuil', duration: 50, distance: 9.9, intensity: 'moderate' },
    { weekNumber: 5, dayOfWeek: 7, date: '2026-03-10', type: 'run', title: 'Sortie longue', duration: 72, distance: 12.6, intensity: 'easy' },
    // Week 6
    { weekNumber: 6, dayOfWeek: 1, date: '2026-03-11', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 32, distance: 5.4, intensity: 'easy' },
    { weekNumber: 6, dayOfWeek: 2, date: '2026-03-12', type: 'run', title: 'FractionnÃ© court', duration: 45, distance: 8.1, intensity: 'interval' },
    { weekNumber: 6, dayOfWeek: 3, date: '2026-03-13', type: 'strength', title: 'Renforcement / PPG', duration: 36, distance: null, intensity: 'moderate' },
    { weekNumber: 6, dayOfWeek: 5, date: '2026-03-15', type: 'run', title: 'Tempo / Seuil', duration: 50, distance: 9.9, intensity: 'moderate' },
    { weekNumber: 6, dayOfWeek: 7, date: '2026-03-17', type: 'run', title: 'Sortie longue', duration: 72, distance: 12.6, intensity: 'easy' },
    // Week 7
    { weekNumber: 7, dayOfWeek: 1, date: '2026-03-18', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 32, distance: 5.4, intensity: 'easy' },
    { weekNumber: 7, dayOfWeek: 2, date: '2026-03-19', type: 'run', title: 'FractionnÃ© court', duration: 45, distance: 8.1, intensity: 'interval' },
    { weekNumber: 7, dayOfWeek: 3, date: '2026-03-20', type: 'strength', title: 'Renforcement / PPG', duration: 36, distance: null, intensity: 'moderate' },
    { weekNumber: 7, dayOfWeek: 5, date: '2026-03-22', type: 'run', title: 'Tempo / Seuil', duration: 50, distance: 9.9, intensity: 'moderate' },
    { weekNumber: 7, dayOfWeek: 7, date: '2026-03-24', type: 'run', title: 'Sortie longue', duration: 72, distance: 12.6, intensity: 'easy' },
    // Week 8
    { weekNumber: 8, dayOfWeek: 1, date: '2026-03-25', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 32, distance: 5.4, intensity: 'easy' },
    { weekNumber: 8, dayOfWeek: 2, date: '2026-03-26', type: 'run', title: 'FractionnÃ© court', duration: 45, distance: 8.1, intensity: 'interval' },
    { weekNumber: 8, dayOfWeek: 3, date: '2026-03-27', type: 'strength', title: 'Renforcement / PPG', duration: 36, distance: null, intensity: 'moderate' },
    { weekNumber: 8, dayOfWeek: 5, date: '2026-03-29', type: 'run', title: 'Tempo / Seuil', duration: 50, distance: 9.9, intensity: 'moderate' },
    { weekNumber: 8, dayOfWeek: 7, date: '2026-03-30', type: 'run', title: 'Sortie longue', duration: 72, distance: 12.6, intensity: 'easy' },
    // Week 9
    { weekNumber: 9, dayOfWeek: 1, date: '2026-03-31', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 35, distance: 6.0, intensity: 'easy' },
    { weekNumber: 9, dayOfWeek: 2, date: '2026-04-01', type: 'run', title: 'FractionnÃ© court', duration: 50, distance: 9.0, intensity: 'interval' },
    { weekNumber: 9, dayOfWeek: 3, date: '2026-04-02', type: 'strength', title: 'Renforcement / PPG', duration: 40, distance: null, intensity: 'moderate' },
    { weekNumber: 9, dayOfWeek: 5, date: '2026-04-04', type: 'run', title: 'Tempo / Seuil', duration: 55, distance: 11.0, intensity: 'moderate' },
    { weekNumber: 9, dayOfWeek: 7, date: '2026-04-06', type: 'run', title: 'Sortie longue', duration: 80, distance: 14.0, intensity: 'easy' },
    // Week 10
    { weekNumber: 10, dayOfWeek: 1, date: '2026-04-07', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 35, distance: 6.0, intensity: 'easy' },
    { weekNumber: 10, dayOfWeek: 2, date: '2026-04-08', type: 'run', title: 'FractionnÃ© court', duration: 50, distance: 9.0, intensity: 'interval' },
    { weekNumber: 10, dayOfWeek: 3, date: '2026-04-09', type: 'strength', title: 'Renforcement / PPG', duration: 40, distance: null, intensity: 'moderate' },
    { weekNumber: 10, dayOfWeek: 5, date: '2026-04-11', type: 'run', title: 'Tempo / Seuil', duration: 55, distance: 11.0, intensity: 'moderate' },
    { weekNumber: 10, dayOfWeek: 7, date: '2026-04-13', type: 'run', title: 'Sortie longue', duration: 80, distance: 14.0, intensity: 'easy' },
    // Week 11 (affÃ»tage)
    { weekNumber: 11, dayOfWeek: 1, date: '2026-04-14', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 18, distance: 3.0, intensity: 'easy' },
    { weekNumber: 11, dayOfWeek: 2, date: '2026-04-15', type: 'run', title: 'FractionnÃ© court', duration: 25, distance: 4.5, intensity: 'moderate' },
    { weekNumber: 11, dayOfWeek: 3, date: '2026-04-16', type: 'strength', title: 'Renforcement / PPG', duration: 20, distance: null, intensity: 'moderate' },
    { weekNumber: 11, dayOfWeek: 5, date: '2026-04-18', type: 'run', title: 'Tempo / Seuil', duration: 28, distance: 5.5, intensity: 'moderate' },
    { weekNumber: 11, dayOfWeek: 7, date: '2026-04-20', type: 'run', title: 'Sortie longue', duration: 40, distance: 7.0, intensity: 'easy' },
    // Week 12 (affÃ»tage final)
    { weekNumber: 12, dayOfWeek: 1, date: '2026-04-21', type: 'run', title: 'Footing rÃ©cupÃ©ration', duration: 18, distance: 3.0, intensity: 'easy' },
    { weekNumber: 12, dayOfWeek: 2, date: '2026-04-22', type: 'run', title: 'FractionnÃ© court', duration: 25, distance: 4.5, intensity: 'moderate' },
    { weekNumber: 12, dayOfWeek: 3, date: '2026-04-23', type: 'strength', title: 'Renforcement / PPG', duration: 20, distance: null, intensity: 'moderate' },
    { weekNumber: 12, dayOfWeek: 5, date: '2026-04-25', type: 'run', title: 'Tempo / Seuil', duration: 28, distance: 5.5, intensity: 'moderate' },
    { weekNumber: 12, dayOfWeek: 7, date: '2026-04-27', type: 'run', title: 'Sortie longue', duration: 40, distance: 7.0, intensity: 'easy' },
  ]

  for (const s of sessions) {
    await prisma.trainingSession.create({
      data: {
        planId: plan.id,
        weekNumber: s.weekNumber,
        dayOfWeek: s.dayOfWeek,
        date: new Date(s.date),
        type: s.type,
        title: s.title,
        duration: s.duration,
        distance: s.distance,
        intensity: s.intensity,
        completed: false,
      },
    })
  }
  console.log(`  ${sessions.length} sÃ©ances crÃ©Ã©es`)

  console.log('\n--- Import terminÃ© avec succÃ¨s ---')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
