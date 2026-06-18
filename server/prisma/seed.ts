import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashPassword } from '../src/utils/password.js'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface SessionTemplate {
  weekNumber: number
  dayOfWeek: number
  type: string
  title: string
  description: string
  duration: number
  distance?: number
  intensity: string
}

function generateWeekSessions(
  weekNumber: number,
  sessions: Omit<SessionTemplate, 'weekNumber'>[]
): SessionTemplate[] {
  return sessions.map(s => ({ ...s, weekNumber }))
}

async function main() {
  // Create system user for templates
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@app.local' },
    update: {},
    create: {
      email: 'system@app.local',
      password: await hashPassword('system-not-for-login'),
      firstName: 'System',
      lastName: 'Templates',
    },
  })

  // ========== Sprint Triathlon 8 weeks ==========
  const sprintSessions: SessionTemplate[] = []
  for (let w = 1; w <= 8; w++) {
    const volume = w <= 6 ? 0.7 + (w * 0.05) : 0.8 // taper last 2 weeks
    sprintSessions.push(
      ...generateWeekSessions(w, [
        { dayOfWeek: 1, type: 'swim', title: 'Natation technique', description: 'Travail technique crawl', duration: Math.round(45 * volume), distance: Math.round(1500 * volume), intensity: 'moderate' },
        { dayOfWeek: 2, type: 'run', title: 'Footing endurance', description: 'Course facile zone 2', duration: Math.round(40 * volume), distance: Math.round(6000 * volume), intensity: 'easy' },
        { dayOfWeek: 3, type: 'bike', title: 'Vélo intervalles', description: 'Intervalles 5x3min', duration: Math.round(60 * volume), distance: Math.round(25000 * volume), intensity: 'hard' },
        { dayOfWeek: 4, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
        { dayOfWeek: 5, type: 'swim', title: 'Natation endurance', description: 'Nage continue', duration: Math.round(40 * volume), distance: Math.round(1200 * volume), intensity: 'easy' },
        { dayOfWeek: 6, type: 'brick', title: 'Enchaînement vélo-course', description: 'Vélo puis transition course', duration: Math.round(75 * volume), intensity: 'moderate' },
        { dayOfWeek: 7, type: 'rest', title: 'Repos', description: 'Récupération complète', duration: 0, intensity: 'easy' },
      ])
    )
  }

  await prisma.trainingPlan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: systemUser.id,
      name: 'Plan Sprint Triathlon - 8 semaines',
      description: 'Plan progressif pour préparer un triathlon sprint (750m/20km/5km)',
      targetType: 'sprint',
      durationWeeks: 8,
      isTemplate: true,
      sessions: { create: sprintSessions },
    },
  })

  // ========== Olympic Triathlon 12 weeks ==========
  const olympicSessions: SessionTemplate[] = []
  for (let w = 1; w <= 12; w++) {
    const volume = w <= 10 ? 0.6 + (w * 0.04) : 0.7
    olympicSessions.push(
      ...generateWeekSessions(w, [
        { dayOfWeek: 1, type: 'swim', title: 'Natation technique', description: 'Technique + séries', duration: Math.round(60 * volume), distance: Math.round(2500 * volume), intensity: 'moderate' },
        { dayOfWeek: 2, type: 'bike', title: 'Vélo endurance', description: 'Sortie longue vélo', duration: Math.round(90 * volume), distance: Math.round(40000 * volume), intensity: 'easy' },
        { dayOfWeek: 3, type: 'run', title: 'Course intervalles', description: 'Fractionné piste', duration: Math.round(50 * volume), distance: Math.round(8000 * volume), intensity: 'hard' },
        { dayOfWeek: 4, type: 'swim', title: 'Natation endurance', description: 'Nage longue continue', duration: Math.round(50 * volume), distance: Math.round(2000 * volume), intensity: 'easy' },
        { dayOfWeek: 5, type: 'strength', title: 'Renforcement', description: 'PPG + gainage', duration: 45, intensity: 'moderate' },
        { dayOfWeek: 6, type: 'brick', title: 'Enchaînement', description: 'Vélo + course enchaînés', duration: Math.round(90 * volume), intensity: 'moderate' },
        { dayOfWeek: 7, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
      ])
    )
  }

  await prisma.trainingPlan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: systemUser.id,
      name: 'Plan Triathlon Olympique - 12 semaines',
      description: 'Préparation triathlon distance olympique (1500m/40km/10km)',
      targetType: 'olympic',
      durationWeeks: 12,
      isTemplate: true,
      sessions: { create: olympicSessions },
    },
  })

  // ========== 10K Running 8 weeks ==========
  const tenKSessions: SessionTemplate[] = []
  for (let w = 1; w <= 8; w++) {
    const volume = w <= 6 ? 0.75 + (w * 0.04) : 0.85
    tenKSessions.push(
      ...generateWeekSessions(w, [
        { dayOfWeek: 1, type: 'run', title: 'Footing récupération', description: 'Course facile', duration: Math.round(35 * volume), distance: Math.round(5000 * volume), intensity: 'easy' },
        { dayOfWeek: 2, type: 'strength', title: 'Renforcement', description: 'PPG coureur', duration: 30, intensity: 'moderate' },
        { dayOfWeek: 3, type: 'run', title: 'Fractionné', description: 'Séries de vitesse', duration: Math.round(45 * volume), distance: Math.round(8000 * volume), intensity: 'hard' },
        { dayOfWeek: 4, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
        { dayOfWeek: 5, type: 'run', title: 'Allure spécifique', description: 'Course à allure 10K', duration: Math.round(40 * volume), distance: Math.round(7000 * volume), intensity: 'race-pace' },
        { dayOfWeek: 6, type: 'run', title: 'Sortie longue', description: 'Endurance fondamentale', duration: Math.round(60 * volume), distance: Math.round(10000 * volume), intensity: 'easy' },
        { dayOfWeek: 7, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
      ])
    )
  }

  await prisma.trainingPlan.upsert({
    where: { id: 3 },
    update: {},
    create: {
      userId: systemUser.id,
      name: 'Plan 10K - 8 semaines',
      description: 'Plan de préparation 10km pour coureur régulier',
      targetType: '10k',
      durationWeeks: 8,
      isTemplate: true,
      sessions: { create: tenKSessions },
    },
  })

  // ========== Semi-Marathon 12 weeks ==========
  const semiSessions: SessionTemplate[] = []
  for (let w = 1; w <= 12; w++) {
    const volume = w <= 10 ? 0.65 + (w * 0.035) : 0.75
    semiSessions.push(
      ...generateWeekSessions(w, [
        { dayOfWeek: 1, type: 'run', title: 'Footing récupération', description: 'Facile zone 1-2', duration: Math.round(40 * volume), distance: Math.round(6000 * volume), intensity: 'easy' },
        { dayOfWeek: 2, type: 'strength', title: 'Renforcement', description: 'PPG + gainage', duration: 35, intensity: 'moderate' },
        { dayOfWeek: 3, type: 'run', title: 'Fractionné court', description: 'VMA courte 30/30', duration: Math.round(50 * volume), distance: Math.round(9000 * volume), intensity: 'hard' },
        { dayOfWeek: 4, type: 'run', title: 'Footing', description: 'Endurance active', duration: Math.round(40 * volume), distance: Math.round(7000 * volume), intensity: 'easy' },
        { dayOfWeek: 5, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
        { dayOfWeek: 6, type: 'run', title: 'Allure spécifique', description: 'Blocs à allure semi', duration: Math.round(55 * volume), distance: Math.round(10000 * volume), intensity: 'race-pace' },
        { dayOfWeek: 7, type: 'run', title: 'Sortie longue', description: 'Endurance fondamentale longue', duration: Math.round(80 * volume), distance: Math.round(15000 * volume), intensity: 'easy' },
      ])
    )
  }

  await prisma.trainingPlan.upsert({
    where: { id: 4 },
    update: {},
    create: {
      userId: systemUser.id,
      name: 'Plan Semi-Marathon - 12 semaines',
      description: 'Préparation semi-marathon (21.1km)',
      targetType: 'semi-marathon',
      durationWeeks: 12,
      isTemplate: true,
      sessions: { create: semiSessions },
    },
  })

  // ========== Marathon 16 weeks ==========
  const marathonSessions: SessionTemplate[] = []
  for (let w = 1; w <= 16; w++) {
    const volume = w <= 13 ? 0.6 + (w * 0.03) : 0.7
    marathonSessions.push(
      ...generateWeekSessions(w, [
        { dayOfWeek: 1, type: 'run', title: 'Footing récupération', description: 'Facile zone 1', duration: Math.round(45 * volume), distance: Math.round(7000 * volume), intensity: 'easy' },
        { dayOfWeek: 2, type: 'run', title: 'Fractionné', description: 'Séries au seuil', duration: Math.round(55 * volume), distance: Math.round(10000 * volume), intensity: 'hard' },
        { dayOfWeek: 3, type: 'strength', title: 'Renforcement', description: 'PPG marathon', duration: 40, intensity: 'moderate' },
        { dayOfWeek: 4, type: 'run', title: 'Footing endurance', description: 'Endurance active', duration: Math.round(50 * volume), distance: Math.round(9000 * volume), intensity: 'easy' },
        { dayOfWeek: 5, type: 'rest', title: 'Repos', description: 'Récupération', duration: 0, intensity: 'easy' },
        { dayOfWeek: 6, type: 'run', title: 'Allure marathon', description: 'Course à allure objectif', duration: Math.round(60 * volume), distance: Math.round(12000 * volume), intensity: 'race-pace' },
        { dayOfWeek: 7, type: 'run', title: 'Sortie longue', description: 'Sortie longue progressive', duration: Math.round(100 * volume), distance: Math.round(20000 * volume), intensity: 'easy' },
      ])
    )
  }

  await prisma.trainingPlan.upsert({
    where: { id: 5 },
    update: {},
    create: {
      userId: systemUser.id,
      name: 'Plan Marathon - 16 semaines',
      description: 'Préparation marathon (42.195km)',
      targetType: 'marathon',
      durationWeeks: 16,
      isTemplate: true,
      sessions: { create: marathonSessions },
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
