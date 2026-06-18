import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashPassword } from '../src/utils/password.js'
import { generateSessionsForPlan } from '../src/modules/training-plans/session-generator.js'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- Creation du compte demo ---')

  // =====================================================
  // 1. Compte de demo
  // =====================================================
  const password = await hashPassword('demo1234')
  const user = await prisma.user.upsert({
    where: { email: 'demo@triathlon-planner.fr' },
    update: {},
    create: {
      email: 'demo@triathlon-planner.fr',
      password,
      firstName: 'Marie',
      lastName: 'Dupont',
      isAdmin: false,
    },
  })
  console.log(`Utilisateur demo cree: ${user.email} / demo1234 (id=${user.id})`)

  // =====================================================
  // 2. Preferences de notification
  // =====================================================
  await prisma.notificationPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailSessionReminder: true,
      emailCompetitionReminder: true,
      reminderDaysBefore: 2,
    },
  })
  console.log('Preferences de notification creees')

  // =====================================================
  // 3. Competitions variees (passees, futures, differents types)
  // =====================================================

  // Supprimer les anciennes competitions du user demo pour eviter les doublons
  await prisma.competition.deleteMany({ where: { userId: user.id } })

  const now = new Date()
  const competitions = await Promise.all([
    // -- Competitions PASSEES --
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Triathlon de Deauville',
        date: new Date(now.getFullYear(), now.getMonth() - 5, 15),
        location: 'Deauville',
        type: 'triathlon',
        subType: 'sprint',
        swimDistance: 750,
        bikeDistance: 20000,
        runDistance: 5000,
        chronoObjective: '1h25',
        result: '1h22:34',
        priority: 'B',
        status: 'completed',
        startTime: '08:30',
        notes: 'Premiere course de la saison. Bonnes sensations en natation, un peu court en course.',
        budget: 85,
        accommodation: 'Airbnb avec le club',
        transport: 'Covoiturage',
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Semi de Paris',
        date: new Date(now.getFullYear(), now.getMonth() - 3, 8),
        location: 'Paris',
        type: 'running',
        subType: 'semi-marathon',
        runDistance: 21100,
        chronoObjective: '1h50',
        result: '1h47:12',
        priority: 'A',
        status: 'completed',
        notes: 'Objectif principal du semestre. Record personnel battu de 3 minutes !',
        budget: 65,
        transport: 'Metro',
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: '10K de Vincennes',
        date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
        location: 'Vincennes',
        type: 'running',
        subType: '10k',
        runDistance: 10000,
        chronoObjective: '48:00',
        result: '46:55',
        priority: 'C',
        status: 'completed',
        notes: 'Course de reprise sympa dans le bois.',
        budget: 25,
      },
    }),

    // -- Competitions FUTURES --
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Triathlon de La Baule',
        date: new Date(now.getFullYear(), now.getMonth() + 2, 22),
        location: 'La Baule',
        type: 'triathlon',
        subType: 'olympic',
        swimDistance: 1500,
        bikeDistance: 40000,
        runDistance: 10000,
        chronoObjective: '2h45',
        priority: 'A',
        status: 'registered',
        startTime: '08:30',
        notes: 'Objectif principal de la saison. Eau libre, parcours velo plat.',
        budget: 120,
        accommodation: 'Hotel Le Concorde',
        transport: 'Train + velo',
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Marathon de Bordeaux',
        date: new Date(now.getFullYear(), now.getMonth() + 4, 12),
        location: 'Bordeaux',
        type: 'running',
        subType: 'marathon',
        runDistance: 42195,
        chronoObjective: '3h45',
        priority: 'A',
        status: 'registered',
        notes: 'Premier marathon ! Parcours repute rapide et plat.',
        budget: 150,
        accommodation: 'A reserver',
        transport: 'TGV',
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Triathlon Sprint du Lac',
        date: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        location: 'Annecy',
        type: 'triathlon',
        subType: 'sprint',
        swimDistance: 750,
        bikeDistance: 20000,
        runDistance: 5000,
        chronoObjective: '1h20',
        priority: 'B',
        status: 'registered',
        notes: 'Preparation pour La Baule. Beau parcours au bord du lac.',
        budget: 75,
        accommodation: 'Camping',
        transport: 'Voiture',
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Trail de la Sainte-Victoire',
        date: new Date(now.getFullYear(), now.getMonth() + 5, 28),
        location: 'Aix-en-Provence',
        type: 'running',
        subType: 'trail',
        runDistance: 25000,
        chronoObjective: '3h00',
        priority: 'C',
        status: 'planned',
        notes: 'Pour le plaisir, beau parcours en montagne.',
        budget: 45,
      },
    }),
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Half Ironman Nice',
        date: new Date(now.getFullYear(), now.getMonth() + 7, 10),
        location: 'Nice',
        type: 'triathlon',
        subType: 'half-ironman',
        swimDistance: 1900,
        bikeDistance: 90000,
        runDistance: 21100,
        chronoObjective: '5h30',
        priority: 'A',
        status: 'planned',
        notes: 'Gros objectif long terme. Debut de la prepa dans 3 mois.',
        budget: 350,
        accommodation: 'A reserver',
        transport: 'Avion ou train',
      },
    }),
    // -- Competition "aujourd'hui" pour tester la banniere RaceDay --
    prisma.competition.create({
      data: {
        userId: user.id,
        name: 'Triathlon de Test — Race Day',
        date: new Date(),
        location: 'Quiberon, Bretagne',
        type: 'triathlon',
        subType: 'sprint',
        status: 'planned',
        priority: 'A',
        startTime: '09:00',
        chronoObjective: '1h15',
        swimDistance: 750,
        bikeDistance: 20000,
        runDistance: 5000,
      },
    }),
  ])

  console.log(`${competitions.length} competitions creees`)

  // Ajouter du materiel a certaines competitions
  const triathlonComp = competitions.find(c => c.name === 'Triathlon de La Baule')!
  const marathonComp = competitions.find(c => c.name === 'Marathon de Bordeaux')!

  await prisma.equipmentItem.createMany({
    data: [
      { competitionId: triathlonComp.id, name: 'Combinaison neoprene', checked: true, category: 'Natation' },
      { competitionId: triathlonComp.id, name: 'Lunettes de natation', checked: true, category: 'Natation' },
      { competitionId: triathlonComp.id, name: 'Bonnet de bain (fourni)', checked: false, category: 'Natation' },
      { competitionId: triathlonComp.id, name: 'Velo + casque', checked: true, category: 'Velo' },
      { competitionId: triathlonComp.id, name: 'Chaussures velo', checked: true, category: 'Velo' },
      { competitionId: triathlonComp.id, name: 'Bidons + nutrition velo', checked: false, category: 'Velo' },
      { competitionId: triathlonComp.id, name: 'Chaussures course', checked: true, category: 'Course' },
      { competitionId: triathlonComp.id, name: 'Dossard + epingles', checked: false, category: 'General' },
      { competitionId: triathlonComp.id, name: 'Creme solaire', checked: false, category: 'General' },
      { competitionId: triathlonComp.id, name: 'Serviette transition', checked: false, category: 'Transition' },
      { competitionId: marathonComp.id, name: 'Chaussures marathon (Vaporfly)', checked: true, category: 'Course' },
      { competitionId: marathonComp.id, name: 'Gels (x6)', checked: false, category: 'Nutrition' },
      { competitionId: marathonComp.id, name: 'Ceinture porte-dossard', checked: true, category: 'General' },
      { competitionId: marathonComp.id, name: 'Montre GPS chargee', checked: false, category: 'General' },
      { competitionId: marathonComp.id, name: 'Vaseline anti-frottements', checked: false, category: 'General' },
    ],
  })
  console.log('Equipements ajoutes aux competitions')

  // =====================================================
  // 4. WellnessLog : 7 jours avant chaque competition terminee
  // =====================================================

  // Supprimer les anciens wellness logs du user demo
  await prisma.wellnessLog.deleteMany({ where: { userId: user.id } })

  // Competitions terminees avec leurs dates
  const deauvilleComp = competitions.find(c => c.name === 'Triathlon de Deauville')!
  const semiComp = competitions.find(c => c.name === 'Semi de Paris')!
  const vincennesComp = competitions.find(c => c.name === '10K de Vincennes')!

  type WellnessEntry = {
    userId: number
    date: Date
    fatigue: number
    mood: number
    sleepQuality: number
    sleepHours: number
    muscleSoreness: number
    stress: number
    restingHR: number
    readinessScore: number
    notes?: string
  }

  // Genere 7 jours de wellness avant une date de course
  function buildPreRaceWellness(
    userId: number,
    raceDate: Date,
    raceLabel: string
  ): WellnessEntry[] {
    const entries: WellnessEntry[] = []
    for (let i = 7; i >= 1; i--) {
      const d = new Date(raceDate)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)

      // Fatigue diminue en approche de la course (affutage)
      const fatigue = i >= 6 ? 3 : i >= 4 ? 2 : 1
      const mood = i >= 6 ? 3 : i >= 3 ? 4 : 5
      const sleepQuality = i === 1 ? 3 : 4 // nuit d'avant souvent moins bonne
      const muscleSoreness = i >= 5 ? 2 : 1
      const stress = i === 1 ? 3 : i <= 3 ? 2 : 2
      const restingHR = 48 + Math.round(Math.random() * 4) + (i === 1 ? 3 : 0)
      const readinessScore = i >= 6 ? 65 : i >= 4 ? 75 : i === 1 ? 80 : 88

      let notes: string | undefined
      if (i === 7) notes = `Debut de la semaine de course — ${raceLabel}`
      if (i === 3) notes = 'Derniere seance courte, affutage bien engage'
      if (i === 1) notes = 'Veille de course, un peu de stress mais forme au top'

      entries.push({
        userId,
        date: d,
        fatigue,
        mood,
        sleepQuality,
        sleepHours: 7 + (sleepQuality >= 4 ? 1 : 0),
        muscleSoreness,
        stress,
        restingHR,
        readinessScore,
        notes,
      })
    }
    return entries
  }

  // Wellness aussi pour les 14 derniers jours (donnees recentes)
  function buildRecentWellness(userId: number): WellnessEntry[] {
    const entries: WellnessEntry[] = []
    for (let i = 14; i >= 1; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)

      const fatigue = 2 + Math.round(Math.random() * 2)
      const mood = 3 + Math.round(Math.random() * 2)
      const sleepQuality = 3 + Math.round(Math.random())
      const muscleSoreness = 1 + Math.round(Math.random() * 2)
      const stress = 2 + Math.round(Math.random())
      const readinessScore = 60 + Math.round(Math.random() * 30)

      entries.push({
        userId,
        date: d,
        fatigue,
        mood,
        sleepQuality,
        sleepHours: 6.5 + Math.round(Math.random() * 2),
        muscleSoreness,
        stress,
        restingHR: 48 + Math.round(Math.random() * 6),
        readinessScore,
      })
    }
    return entries
  }

  const wellnessEntries: WellnessEntry[] = [
    ...buildPreRaceWellness(user.id, deauvilleComp.date, 'Triathlon de Deauville'),
    ...buildPreRaceWellness(user.id, semiComp.date, 'Semi de Paris'),
    ...buildPreRaceWellness(user.id, vincennesComp.date, '10K de Vincennes'),
    ...buildRecentWellness(user.id),
  ]

  // Deduplique par date (au cas ou des plages se chevauchent)
  const seenDates = new Set<string>()
  const uniqueWellness = wellnessEntries.filter(e => {
    const key = e.date.toISOString().split('T')[0]
    if (seenDates.has(key)) return false
    seenDates.add(key)
    return true
  })

  await prisma.wellnessLog.createMany({ data: uniqueWellness })
  console.log(`${uniqueWellness.length} wellness logs crees (pre-course + recents)`)

  // =====================================================
  // 5. Plans d'entrainement (3 niveaux differents)
  // =====================================================

  // Supprimer les anciens plans du user demo
  await prisma.trainingPlan.deleteMany({ where: { userId: user.id } })

  // --- Plan 1 : Debutant 5K (termine, avec progression) ---
  const startDate5K = new Date(now.getFullYear(), now.getMonth() - 4, 1)
  const plan5K = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Mon premier 5K',
      description: 'Programme debutant pour courir 5K sans s\'arreter',
      targetType: '5k',
      durationWeeks: 6,
      level: 'beginner',
      weeklyHours: 3,
      startDate: startDate5K,
      endDate: new Date(startDate5K.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(plan5K.id, '5k', 6, startDate5K, 'beginner')

  // Lier la competition Deauville au plan 5K (course de la meme periode)
  await prisma.planCompetition.create({
    data: {
      planId: plan5K.id,
      competitionId: deauvilleComp.id,
      isPrimary: false,
      order: 0,
    },
  })

  // Marquer la majorite des seances comme terminees (plan passe)
  const sessions5K = await prisma.trainingSession.findMany({ where: { planId: plan5K.id } })
  for (const s of sessions5K) {
    await prisma.trainingSession.update({
      where: { id: s.id },
      data: {
        completed: true,
        actualDuration: s.duration ? Math.round(s.duration * (0.9 + Math.random() * 0.2)) : null,
        actualDistance: s.distance ? Math.round(s.distance * (0.95 + Math.random() * 0.1)) : null,
        notes: Math.random() > 0.7 ? 'Bonnes sensations' : undefined,
      },
    })
  }
  console.log(`Plan "${plan5K.name}" cree avec ${sessions5K.length} seances (toutes terminees)`)

  // --- Plan 2 : Intermediaire Triathlon Olympique (en cours) ---
  const startDateTri = new Date(now.getFullYear(), now.getMonth() - 1, getMonday(now).getDate())
  const planTri = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Prepa Triathlon La Baule',
      description: 'Preparation pour le triathlon olympique de La Baule. Objectif : 2h45.',
      targetType: 'olympic',
      durationWeeks: 12,
      level: 'intermediate',
      weeklyHours: 8,
      startDate: startDateTri,
      endDate: new Date(startDateTri.getTime() + 12 * 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Lier la competition cible
  await prisma.planCompetition.create({
    data: {
      planId: planTri.id,
      competitionId: triathlonComp.id,
      isPrimary: true,
      order: 0,
    },
  })
  const sprintComp = competitions.find(c => c.name === 'Triathlon Sprint du Lac')!
  await prisma.planCompetition.create({
    data: {
      planId: planTri.id,
      competitionId: sprintComp.id,
      isPrimary: false,
      order: 1,
    },
  })

  await generateSessionsForPlan(planTri.id, 'olympic', 12, startDateTri, 'intermediate')

  // Marquer les 4 premieres semaines comme terminees (en cours de la 5eme)
  const sessionsTri = await prisma.trainingSession.findMany({
    where: { planId: planTri.id },
    orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
  })
  for (const s of sessionsTri) {
    if (s.weekNumber <= 4) {
      await prisma.trainingSession.update({
        where: { id: s.id },
        data: {
          completed: true,
          actualDuration: s.duration ? Math.round(s.duration * (0.9 + Math.random() * 0.2)) : null,
          actualDistance: s.distance ? Math.round(s.distance * (0.95 + Math.random() * 0.1)) : null,
          notes: getRandomNote(s.type),
        },
      })
    }
  }
  console.log(`Plan "${planTri.name}" cree avec ${sessionsTri.length} seances (semaines 1-4 terminees)`)

  // --- Plan 3 : Avance Marathon (futur, pas encore commence) ---
  const startDateMarathon = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  // Mettre au lundi
  startDateMarathon.setDate(startDateMarathon.getDate() - ((startDateMarathon.getDay() + 6) % 7))

  const planMarathon = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Prepa Marathon Bordeaux',
      description: 'Plan avance marathon 16 semaines. Objectif sub 3h45.',
      targetType: 'marathon',
      durationWeeks: 16,
      level: 'advanced',
      weeklyHours: 10,
      startDate: startDateMarathon,
      endDate: new Date(startDateMarathon.getTime() + 16 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.planCompetition.create({
    data: {
      planId: planMarathon.id,
      competitionId: marathonComp.id,
      isPrimary: true,
      order: 0,
    },
  })
  await generateSessionsForPlan(planMarathon.id, 'marathon', 16, startDateMarathon, 'advanced')

  const sessionsMarathon = await prisma.trainingSession.count({ where: { planId: planMarathon.id } })
  console.log(`Plan "${planMarathon.name}" cree avec ${sessionsMarathon} seances (pas encore commence)`)

  // --- Plan 4 : Intermediaire natation (en cours) ---
  const startDateSwim = new Date(now.getFullYear(), now.getMonth(), 1)
  startDateSwim.setDate(startDateSwim.getDate() - ((startDateSwim.getDay() + 6) % 7))

  const planSwim = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Progression natation',
      description: 'Ameliorer ma technique crawl et endurance pour les triathlons.',
      targetType: 'natation',
      durationWeeks: 8,
      level: 'intermediate',
      weeklyHours: 4,
      startDate: startDateSwim,
      endDate: new Date(startDateSwim.getTime() + 8 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(planSwim.id, 'natation', 8, startDateSwim, 'intermediate')

  // Marquer la premiere semaine comme terminee
  const sessionsSwim = await prisma.trainingSession.findMany({
    where: { planId: planSwim.id },
  })
  for (const s of sessionsSwim) {
    if (s.weekNumber <= 1) {
      await prisma.trainingSession.update({
        where: { id: s.id },
        data: {
          completed: true,
          actualDuration: s.duration ? Math.round(s.duration * (0.9 + Math.random() * 0.2)) : null,
          notes: s.type === 'swim' ? 'Travail sur la respiration bilaterale' : undefined,
        },
      })
    }
  }
  console.log(`Plan "${planSwim.name}" cree avec ${sessionsSwim.length} seances (semaine 1 terminee)`)

  // --- Plan 5 : Debutant velo (plan partage / public) ---
  const startDateBike = new Date(now.getFullYear(), now.getMonth() - 2, 10)
  const planBike = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      name: 'Debuter en velo de route',
      description: 'Plan pour debutants qui souhaitent se mettre au velo de route progressivement.',
      targetType: 'velo',
      durationWeeks: 6,
      level: 'beginner',
      weeklyHours: 4,
      isPublic: true,
      shareCode: 'demo-bike-2026ab',
      startDate: startDateBike,
      endDate: new Date(startDateBike.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(planBike.id, 'velo', 6, startDateBike, 'beginner')

  const sessionsBike = await prisma.trainingSession.findMany({ where: { planId: planBike.id } })
  // Tout marquer comme termine (plan fini et partage)
  for (const s of sessionsBike) {
    await prisma.trainingSession.update({
      where: { id: s.id },
      data: {
        completed: true,
        actualDuration: s.duration ? Math.round(s.duration * (0.85 + Math.random() * 0.3)) : null,
        actualDistance: s.distance ? Math.round(s.distance * (0.9 + Math.random() * 0.15)) : null,
      },
    })
  }
  console.log(`Plan "${planBike.name}" cree (public/partage, termine)`)

  // =====================================================
  // 6. Objectifs de saison (SeasonGoal)
  // =====================================================

  // Nettoyer les anciens objectifs pour eviter les doublons au rejeu
  await prisma.seasonGoal.deleteMany({ where: { userId: user.id } })

  await prisma.seasonGoal.createMany({
    data: [
      { userId: user.id, sport: 'run',  year: 2026, type: 'distance', targetValue: 500,  unit: 'km',       label: 'Distance course a pied' },
      { userId: user.id, sport: 'bike', year: 2026, type: 'distance', targetValue: 2000, unit: 'km',       label: 'Distance velo' },
      { userId: user.id, sport: 'swim', year: 2026, type: 'distance', targetValue: 50,   unit: 'km',       label: 'Distance natation' },
      { userId: user.id, sport: 'all',  year: 2026, type: 'sessions', targetValue: 150,  unit: 'sessions', label: 'Seances totales' },
    ],
  })
  console.log('4 objectifs de saison 2026 crees')

  // =====================================================
  // 7. Resume
  // =====================================================
  console.log('\n========================================')
  console.log('COMPTE DEMO PRET')
  console.log('========================================')
  console.log(`Email    : demo@triathlon-planner.fr`)
  console.log(`Mot de passe : demo1234`)
  console.log('')
  console.log('Contenu :')
  console.log(`  - ${competitions.length} competitions (3 passees, 5 futures + 1 race-day aujourd'hui)`)
  console.log(`  - 5 plans d'entrainement :`)
  console.log(`    1. "Mon premier 5K" (debutant, termine) — lie a Deauville`)
  console.log(`    2. "Prepa Triathlon La Baule" (intermediaire, en cours semaine 5/12)`)
  console.log(`    3. "Prepa Marathon Bordeaux" (avance, futur)`)
  console.log(`    4. "Progression natation" (intermediaire, semaine 2/8)`)
  console.log(`    5. "Debuter en velo de route" (debutant, termine, partage)`)
  console.log(`  - Equipements checklist sur 2 competitions`)
  console.log(`  - ${uniqueWellness.length} wellness logs (7j pre-course x3 + 14j recents)`)
  console.log(`  - 4 objectifs de saison 2026`)
  console.log(`  - Preferences de notification configurees`)
  console.log('========================================')
}

// --- Helpers ---

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function getRandomNote(type: string): string | undefined {
  if (Math.random() > 0.4) return undefined
  const notes: Record<string, string[]> = {
    swim: [
      'Bonnes sensations dans l\'eau',
      'Travail sur le roulis OK',
      'Un peu fatigue, 200m de moins que prevu',
      'Meilleur chrono au 400m !',
    ],
    bike: [
      'Vent de face au retour',
      'Bonnes jambes, cadence elevee',
      'Crevaison au km 15, repare en 8 min',
      'Nouveau record sur le segment Strava',
    ],
    run: [
      'Legs lourdes au debut puis ca s\'est debloque',
      'Bonne seance, allures respectees',
      'Un peu chaud, bien hydrate',
      'Sensations top, progression constante',
    ],
    strength: [
      'Gainage + squats OK',
      'Ajout de poids sur les fentes',
    ],
    brick: [
      'Transition fluide, jambes OK apres le velo',
      'Dur au debut de la course puis ca passe',
    ],
    rest: [],
  }
  const pool = notes[type] || []
  if (pool.length === 0) return undefined
  return pool[Math.floor(Math.random() * pool.length)]
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
