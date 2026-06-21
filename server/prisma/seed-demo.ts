import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../src/utils/password.js'
import { generateSessionsForPlan } from '../src/modules/training-plans/session-generator.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- Création du compte démo ---')

  const now = new Date()

  // =====================================================
  // Semaine courante (pour calcul weekNumber ISO)
  // =====================================================
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  )

  // =====================================================
  // 1. Utilisateurs
  // =====================================================
  const password = await hashPassword('demo1234')
  const coachPassword = await hashPassword('coach1234')
  const athletePassword = await hashPassword('athlete1234')
  const adminPassword = await hashPassword('admin1234')

  // Utilisateur démo principal : Léa Fontaine
  const lea = await prisma.user.upsert({
    where: { email: 'demo@triathlon-planner.fr' },
    update: { firstName: 'Léa', lastName: 'Fontaine', onboardingCompleted: true },
    create: {
      email: 'demo@triathlon-planner.fr',
      password,
      firstName: 'Léa',
      lastName: 'Fontaine',
      isAdmin: false,
      onboardingCompleted: true,
    },
  })
  console.log(`Utilisateur démo créé : ${lea.email} / demo1234 (id=${lea.id})`)

  // Coach : Thomas Mercier
  const thomas = await prisma.user.upsert({
    where: { email: 'thomas.mercier@triathlon-nantes.fr' },
    update: { onboardingCompleted: true },
    create: {
      email: 'thomas.mercier@triathlon-nantes.fr',
      password: coachPassword,
      firstName: 'Thomas',
      lastName: 'Mercier',
      isAdmin: false,
      onboardingCompleted: true,
    },
  })

  // Athlètes du club
  const marc = await prisma.user.upsert({
    where: { email: 'marc.petit@triathlon-nantes.fr' },
    update: {},
    create: {
      email: 'marc.petit@triathlon-nantes.fr',
      password: athletePassword,
      firstName: 'Marc',
      lastName: 'Petit',
      isAdmin: false,
      onboardingCompleted: true,
    },
  })

  const sofia = await prisma.user.upsert({
    where: { email: 'sofia.adler@triathlon-nantes.fr' },
    update: { onboardingCompleted: true },
    create: {
      email: 'sofia.adler@triathlon-nantes.fr',
      password: athletePassword,
      firstName: 'Sofia',
      lastName: 'Adler',
      isAdmin: false,
      onboardingCompleted: true,
    },
  })

  const julie = await prisma.user.upsert({
    where: { email: 'julie.bernard@triathlon-nantes.fr' },
    update: { onboardingCompleted: true },
    create: {
      email: 'julie.bernard@triathlon-nantes.fr',
      password: athletePassword,
      firstName: 'Julie',
      lastName: 'B.',
      isAdmin: false,
      onboardingCompleted: true,
    },
  })

  // Admin CODIR : Marie Lemoine
  const marie = await prisma.user.upsert({
    where: { email: 'marie.lemoine@triathlon-nantes.fr' },
    update: { onboardingCompleted: true },
    create: {
      email: 'marie.lemoine@triathlon-nantes.fr',
      password: adminPassword,
      firstName: 'Marie',
      lastName: 'Lemoine',
      isAdmin: true,
      onboardingCompleted: true,
    },
  })

  console.log('6 utilisateurs créés (Léa, Thomas, Marc, Sofia, Julie, Marie)')

  // =====================================================
  // 2. Préférences de notification
  // =====================================================
  await prisma.notificationPreferences.upsert({
    where: { userId: lea.id },
    update: {},
    create: {
      userId: lea.id,
      emailSessionReminder: true,
      emailCompetitionReminder: true,
      reminderDaysBefore: 2,
    },
  })

  // =====================================================
  // 3. Club : Triathlon Club Nantais
  // =====================================================
  await prisma.clubMember.deleteMany({ where: { userId: { in: [lea.id, thomas.id, marc.id, sofia.id, julie.id, marie.id] } } })

  const existingClub = await prisma.club.findFirst({ where: { name: 'Triathlon Club Nantais' } })
  const club = existingClub ?? await prisma.club.create({ data: { name: 'Triathlon Club Nantais' } })

  await prisma.clubMember.createMany({
    data: [
      { clubId: club.id, userId: marie.id, role: 'admin' },
      { clubId: club.id, userId: thomas.id, role: 'coach' },
      { clubId: club.id, userId: lea.id, role: 'athlete' },
      { clubId: club.id, userId: marc.id, role: 'athlete' },
      { clubId: club.id, userId: sofia.id, role: 'athlete' },
      { clubId: club.id, userId: julie.id, role: 'athlete' },
    ],
  })
  console.log('Club "Triathlon Club Nantais" créé avec 6 membres (Marie=admin, Thomas=coach)')

  // =====================================================
  // 3b. Athlètes supplémentaires pour les groupes
  // =====================================================
  const extraAthletes = [
    { email: 'helene.dubois@triathlon-nantes.fr', firstName: 'Hélène', lastName: 'Dubois' },
    { email: 'yanis.baki@triathlon-nantes.fr', firstName: 'Yanis', lastName: 'Baki' },
    { email: 'emma.legoff@triathlon-nantes.fr', firstName: 'Emma', lastName: 'Le Goff' },
    { email: 'noe.renaud@triathlon-nantes.fr', firstName: 'Noé', lastName: 'Renaud' },
    { email: 'theo.pichon@triathlon-nantes.fr', firstName: 'Théo', lastName: 'Pichon' },
    { email: 'clara.roux@triathlon-nantes.fr', firstName: 'Clara', lastName: 'Roux' },
    { email: 'marc.berthier@triathlon-nantes.fr', firstName: 'Marc', lastName: 'Berthier' },
    { email: 'julie.lemaire@triathlon-nantes.fr', firstName: 'Julie', lastName: 'Lemaire' },
    { email: 'adrien.daniel@triathlon-nantes.fr', firstName: 'Adrien', lastName: 'Daniel' },
  ]

  const extraUsers = await Promise.all(
    extraAthletes.map(u =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { email: u.email, password: athletePassword, firstName: u.firstName, lastName: u.lastName, isAdmin: false, onboardingCompleted: true },
      }),
    ),
  )

  const [helene, yanis, emma, noe, theo, clara, marcB, julieLemaire, adrien] = extraUsers

  await prisma.clubMember.deleteMany({ where: { userId: { in: extraUsers.map(u => u.id) } } })
  await prisma.clubMember.createMany({
    data: extraUsers.map(u => ({ clubId: club.id, userId: u.id, role: 'athlete' })),
  })

  // =====================================================
  // 3c. Groupes d'entraînement
  // =====================================================
  await prisma.trainingGroupMember.deleteMany({ where: { group: { clubId: club.id } } })
  await prisma.trainingGroup.deleteMany({ where: { clubId: club.id } })

  const groupDecouverte = await prisma.trainingGroup.create({
    data: { clubId: club.id, name: 'Découverte', level: 'Débutant', description: 'Premiers pas en triathlon : technique, régularité et plaisir avant la performance.', icon: 'leaf', color: 'cyan', weeklyHours: 5, sessionsPerWeek: 4 },
  })
  const groupEndurance = await prisma.trainingGroup.create({
    data: { clubId: club.id, name: 'Endurance Loisir', level: 'Intermédiaire', description: 'Forme et sorties longues, sans pression de chrono. Une à deux courses plaisir par an.', icon: 'bike', color: 'emerald', weeklyHours: 7, sessionsPerWeek: 5 },
  })
  const groupCompetition = await prisma.trainingGroup.create({
    data: { clubId: club.id, name: 'Compétition', level: 'Avancé', description: "Objectifs de saison : Triathlon de Nantes, La Baule. Charge structurée et périodisée.", icon: 'trophy', color: 'orange', weeklyHours: 8.5, sessionsPerWeek: 6 },
  })
  const groupLongue = await prisma.trainingGroup.create({
    data: { clubId: club.id, name: 'Longue Distance', level: 'Élite', description: 'Préparation Half & Ironman. Gros volumes, double séance et suivi rapproché.', icon: 'mountain', color: 'slate', weeklyHours: 12, sessionsPerWeek: 7 },
  })

  await prisma.trainingGroupMember.createMany({
    data: [
      { groupId: groupDecouverte.id, userId: yanis.id },
      { groupId: groupDecouverte.id, userId: emma.id },
      { groupId: groupDecouverte.id, userId: noe.id },
      { groupId: groupDecouverte.id, userId: theo.id },
      { groupId: groupEndurance.id, userId: clara.id },
      { groupId: groupEndurance.id, userId: marcB.id },
      { groupId: groupEndurance.id, userId: julieLemaire.id },
      { groupId: groupEndurance.id, userId: adrien.id },
      { groupId: groupCompetition.id, userId: lea.id },
      { groupId: groupCompetition.id, userId: marc.id },
      { groupId: groupCompetition.id, userId: sofia.id },
      { groupId: groupLongue.id, userId: helene.id },
    ],
  })
  console.log('4 groupes d\'entraînement créés avec athlètes assignés')

  // =====================================================
  // 4. Compétitions de Léa
  // =====================================================
  await prisma.competition.deleteMany({ where: { userId: lea.id } })

  const competitions = await Promise.all([
    // -- PASSÉES --
    prisma.competition.create({
      data: {
        userId: lea.id,
        name: 'Triathlon de Pornic',
        date: new Date(2026, 4, 11), // 11 mai 2026
        location: 'Pornic',
        type: 'triathlon',
        subType: 'sprint',
        swimDistance: 750,
        bikeDistance: 20000,
        runDistance: 5000,
        status: 'completed',
        priority: 'B',
        finishTime: '1h12:40',
        runPace: '4:18 /km',
        rank: 8,
        notes: 'Belle course, bonne transition.',
      },
    }),
    prisma.competition.create({
      data: {
        userId: lea.id,
        name: 'Semi de Paris',
        date: new Date(now.getFullYear(), now.getMonth() - 3, 8),
        location: 'Paris',
        type: 'running',
        subType: 'semi-marathon',
        runDistance: 21100,
        status: 'completed',
        priority: 'B',
        finishTime: '1h47:12',
        runPace: '5:05 /km',
        rank: 142,
        notes: 'Bonne forme, objectif atteint.',
      },
    }),

    // -- FUTURES — objectif C : Tri Sprint de Vertou (J-~12) --
    prisma.competition.create({
      data: {
        userId: lea.id,
        name: 'Tri Sprint de Vertou',
        date: new Date(2026, 6, 2), // 2 juillet 2026
        location: 'Vertou',
        type: 'triathlon',
        subType: 'sprint',
        swimDistance: 750,
        bikeDistance: 20000,
        runDistance: 5000,
        chronoObjective: '1h15',
        priority: 'C',
        status: 'dns',
        startTime: '09:00',
        notes: 'Course de préparation avant La Baule.',
        budget: 55,
      },
    }),

    // -- FUTURES — objectif B : Audencia La Baule (J-~84) --
    prisma.competition.create({
      data: {
        userId: lea.id,
        name: 'Audencia La Baule',
        date: new Date(2026, 8, 12), // 12 septembre 2026
        location: 'La Baule',
        type: 'triathlon',
        subType: 'half-ironman',
        swimDistance: 1900,
        bikeDistance: 90000,
        runDistance: 21100,
        chronoObjective: '5h20',
        priority: 'B',
        status: 'planned',
        startTime: '07:30',
        notes: 'Semi-distance, objectif intermédiaire.',
        budget: 180,
        accommodation: 'Hôtel à La Baule',
        transport: 'Train + vélo',
      },
    }),

    // -- FUTURES — objectif A : Triathlon de Nantes (19 oct) --
    prisma.competition.create({
      data: {
        userId: lea.id,
        name: 'Triathlon de Nantes',
        date: new Date(2026, 9, 19), // 19 octobre 2026
        location: 'Nantes',
        type: 'triathlon',
        subType: 'olympic',
        swimDistance: 1500,
        bikeDistance: 40000,
        runDistance: 10000,
        chronoObjective: '2h30',
        priority: 'A',
        status: 'registered',
        startTime: '08:30',
        notes: 'Objectif principal de la saison. Eau de Loire, parcours vélo plat.',
        budget: 120,
        accommodation: 'Chez famille',
        transport: 'Voiture',
      },
    }),
  ])

  console.log(`${competitions.length} compétitions de Léa créées`)

  const nantesComp = competitions.find(c => c.name === 'Triathlon de Nantes')!
  const vertouComp = competitions.find(c => c.name === 'Tri Sprint de Vertou')!

  // Équipements pour la compét principale
  await prisma.equipmentItem.createMany({
    data: [
      { competitionId: nantesComp.id, name: 'Combinaison néoprène', checked: true, category: 'Natation' },
      { competitionId: nantesComp.id, name: 'Lunettes de natation', checked: true, category: 'Natation' },
      { competitionId: nantesComp.id, name: 'Bonnet de bain', checked: false, category: 'Natation' },
      { competitionId: nantesComp.id, name: 'Vélo + casque', checked: true, category: 'Vélo' },
      { competitionId: nantesComp.id, name: 'Chaussures vélo', checked: true, category: 'Vélo' },
      { competitionId: nantesComp.id, name: 'Bidons + nutrition vélo', checked: false, category: 'Vélo' },
      { competitionId: nantesComp.id, name: 'Chaussures course', checked: true, category: 'Course' },
      { competitionId: nantesComp.id, name: 'Dossard + épingles', checked: false, category: 'Général' },
      { competitionId: nantesComp.id, name: 'Serviette transition', checked: false, category: 'Transition' },
    ],
  })

  // =====================================================
  // 5. Wellness de Léa (42 jours pour CTL ~82, ATL ~87, TSB ~-5)
  // =====================================================
  await prisma.wellnessLog.deleteMany({ where: { userId: lea.id } })

  const leaWellness = []
  for (let i = 42; i >= 1; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const readiness = i <= 7 ? 87 + Math.round(Math.random() * 4 - 2) : 81 + Math.round(Math.random() * 4 - 2)
    leaWellness.push({
      userId: lea.id,
      date: d,
      fatigue: i <= 7 ? 3 : 2,
      mood: i <= 7 ? 4 : 3,
      sleepQuality: 4,
      sleepHours: 7.5,
      muscleSoreness: i <= 7 ? 3 : 2,
      stress: 2,
      restingHR: 48 + Math.round(Math.random() * 4),
      readinessScore: readiness,
    })
  }
  await prisma.wellnessLog.createMany({ data: leaWellness })
  console.log(`${leaWellness.length} wellness logs créés pour Léa (CTL~82, TSB~-5)`)

  // =====================================================
  // 6. Plans d'entraînement de Léa
  // =====================================================
  await prisma.trainingPlan.deleteMany({ where: { userId: lea.id } })

  // Plan actif : semaine 6/12 (startDate = lundi il y a 5 semaines)
  const mondayNow = getMonday(now)
  const startDateTri = new Date(mondayNow.getTime() - 5 * 7 * 24 * 60 * 60 * 1000)

  const planTri = await prisma.trainingPlan.create({
    data: {
      userId: lea.id,
      name: 'Prepa Triathlon de Nantes',
      description: 'Préparation pour le triathlon olympique de Nantes. Objectif : 2h30.',
      targetType: 'olympic',
      durationWeeks: 12,
      level: 'intermediate',
      weeklyHours: 8,
      startDate: startDateTri,
      endDate: new Date(startDateTri.getTime() + 12 * 7 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.planCompetition.create({
    data: { planId: planTri.id, competitionId: nantesComp.id, isPrimary: true, order: 0 },
  })
  await prisma.planCompetition.create({
    data: { planId: planTri.id, competitionId: vertouComp.id, isPrimary: false, order: 1 },
  })

  await generateSessionsForPlan(planTri.id, 'olympic', 12, startDateTri, 'intermediate')

  // Semaines 1-5 terminées
  const sessionsTri = await prisma.trainingSession.findMany({
    where: { planId: planTri.id },
    orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
  })
  for (const s of sessionsTri) {
    if (s.weekNumber <= 5) {
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
  console.log(`Plan "${planTri.name}" créé — semaine 6/12 en cours`)

  // Plan natation (secondaire, en cours)
  const startDateSwim = new Date(now.getFullYear(), now.getMonth(), 1)
  startDateSwim.setDate(startDateSwim.getDate() - ((startDateSwim.getDay() + 6) % 7))

  const planSwim = await prisma.trainingPlan.create({
    data: {
      userId: lea.id,
      name: 'Progression natation',
      description: 'Améliorer technique crawl et endurance pour les triathlons.',
      targetType: 'natation',
      durationWeeks: 8,
      level: 'intermediate',
      weeklyHours: 4,
      startDate: startDateSwim,
      endDate: new Date(startDateSwim.getTime() + 8 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(planSwim.id, 'natation', 8, startDateSwim, 'intermediate')

  // Plan partagé (public)
  const startDateBike = new Date(now.getFullYear(), now.getMonth() - 2, 10)
  const planBike = await prisma.trainingPlan.create({
    data: {
      userId: lea.id,
      name: 'Débuter en vélo de route',
      description: 'Plan pour débutants qui souhaitent se mettre au vélo de route progressivement.',
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
  for (const s of sessionsBike) {
    await prisma.trainingSession.update({
      where: { id: s.id },
      data: {
        completed: true,
        actualDuration: s.duration ? Math.round(s.duration * (0.85 + Math.random() * 0.3)) : null,
      },
    })
  }
  console.log('Plans de Léa créés')

  // =====================================================
  // 7. CoachPlanSuggestion (status=sent → bannière orange)
  // =====================================================
  await prisma.coachPlanSuggestion.deleteMany({ where: { athleteId: lea.id } })

  const suggestions = [
    { id: 'focus_swim', title: 'Focus natation', delta: '+15 min', why: 'Point de progression identifié', enabled: true },
    { id: 'sync_phys', title: 'Prépa physique synchronisée', delta: '3 séances', why: 'Julie B. confirmée', enabled: true },
    { id: 'reduce_volume', title: 'Charge allégée', delta: '−30 min', why: 'Forme en légère baisse', enabled: false },
  ]

  await prisma.coachPlanSuggestion.create({
    data: {
      coachId: thomas.id,
      athleteId: lea.id,
      planId: planTri.id,
      weekNumber: currentWeek,
      suggestions: JSON.stringify(suggestions),
      coachNote:
        'Belle régularité Léa. On allège un peu le vélo et on cale le renfo avec Julie, focus technique natation.',
      status: 'sent',
      sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // il y a 2h
    },
  })
  console.log('CoachPlanSuggestion créé (status=sent, semaine courante)')

  // =====================================================
  // 8. Wellness des autres athlètes (pour le roster coach)
  // =====================================================

  // Marc : CTL ~64, ATL ~56, TSB ~+8
  await prisma.wellnessLog.deleteMany({ where: { userId: marc.id } })
  const marcWellness = []
  for (let i = 42; i >= 1; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    marcWellness.push({
      userId: marc.id,
      date: d,
      fatigue: 2,
      mood: 4,
      sleepQuality: 4,
      sleepHours: 8,
      muscleSoreness: 1,
      stress: 2,
      restingHR: 52 + Math.round(Math.random() * 4),
      readinessScore: i <= 7 ? 56 + Math.round(Math.random() * 4 - 2) : 66 + Math.round(Math.random() * 4 - 2),
    })
  }
  await prisma.wellnessLog.createMany({ data: marcWellness })

  // Sofia : CTL ~91, ATL ~93, TSB ~-2
  await prisma.wellnessLog.deleteMany({ where: { userId: sofia.id } })
  const sofiaWellness = []
  for (let i = 42; i >= 1; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    sofiaWellness.push({
      userId: sofia.id,
      date: d,
      fatigue: 1,
      mood: 5,
      sleepQuality: 5,
      sleepHours: 8.5,
      muscleSoreness: 2,
      stress: 1,
      restingHR: 44 + Math.round(Math.random() * 4),
      readinessScore: i <= 7 ? 93 + Math.round(Math.random() * 4 - 2) : 90 + Math.round(Math.random() * 4 - 2),
    })
  }
  await prisma.wellnessLog.createMany({ data: sofiaWellness })
  console.log('Wellness créé pour Marc et Sofia')

  // Plans des autres athlètes (pour le roster)
  await prisma.trainingPlan.deleteMany({ where: { userId: marc.id } })
  await prisma.trainingPlan.deleteMany({ where: { userId: sofia.id } })

  const marcPlan = await prisma.trainingPlan.create({
    data: {
      userId: marc.id,
      name: 'Prepa Tri Sprint Vertou',
      targetType: 'sprint',
      durationWeeks: 8,
      level: 'intermediate',
      weeklyHours: 6,
      startDate: new Date(mondayNow.getTime() - 3 * 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(mondayNow.getTime() + 5 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(marcPlan.id, 'sprint', 8, new Date(mondayNow.getTime() - 3 * 7 * 24 * 60 * 60 * 1000), 'intermediate')

  const sofiaPlan = await prisma.trainingPlan.create({
    data: {
      userId: sofia.id,
      name: 'Prepa Half Ironman Bauduen',
      targetType: 'half-ironman',
      durationWeeks: 16,
      level: 'advanced',
      weeklyHours: 12,
      startDate: new Date(mondayNow.getTime() - 8 * 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(mondayNow.getTime() + 8 * 7 * 24 * 60 * 60 * 1000),
    },
  })
  await generateSessionsForPlan(sofiaPlan.id, 'half-ironman', 16, new Date(mondayNow.getTime() - 8 * 7 * 24 * 60 * 60 * 1000), 'advanced')

  // CoachPlanSuggestions pour les autres athlètes (pour le roster statut)
  await prisma.coachPlanSuggestion.deleteMany({ where: { athleteId: marc.id } })
  await prisma.coachPlanSuggestion.create({
    data: {
      coachId: thomas.id,
      athleteId: marc.id,
      planId: marcPlan.id,
      weekNumber: currentWeek,
      suggestions: JSON.stringify([{ id: 'extra_run', title: 'Sortie longue', delta: '+45 min', enabled: true }]),
      status: 'sent',
      sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  })

  await prisma.coachPlanSuggestion.deleteMany({ where: { athleteId: sofia.id } })
  await prisma.coachPlanSuggestion.create({
    data: {
      coachId: thomas.id,
      athleteId: sofia.id,
      planId: sofiaPlan.id,
      weekNumber: currentWeek,
      suggestions: JSON.stringify([{ id: 'bike_interval', title: 'Séance vélo seuil', delta: '+30 min', enabled: true }]),
      status: 'draft',
    },
  })

  console.log('Plans + suggestions créés pour Marc et Sofia')

  // =====================================================
  // 9. Threads de messages
  // =====================================================
  await prisma.message.deleteMany({
    where: {
      thread: {
        participants: { contains: String(lea.id) },
      },
    },
  })
  await prisma.messageThread.deleteMany({
    where: { participants: { contains: String(lea.id) } },
  })

  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const yesterdayAt9 = new Date(now.getTime() - 22 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Thread 1 : Thomas (coach) ↔ Léa
  const thread1 = await prisma.messageThread.create({
    data: {
      participants: JSON.stringify([thomas.id, lea.id]),
      lastMessage: "J'ai ajusté ta semaine, focus natation.",
      lastAt: twoHoursAgo,
    },
  })
  await prisma.message.createMany({
    data: [
      {
        threadId: thread1.id,
        senderId: thomas.id,
        content: 'Salut Léa ! Belle semaine dernière, tu progresses bien en natation 💪',
        readBy: JSON.stringify([thomas.id, lea.id]),
        createdAt: new Date(twoHoursAgo.getTime() - 30 * 60 * 1000),
      },
      {
        threadId: thread1.id,
        senderId: lea.id,
        content: 'Merci coach ! Par contre les jambes étaient lourdes sur la VMA.',
        readBy: JSON.stringify([thomas.id, lea.id]),
        createdAt: new Date(twoHoursAgo.getTime() - 20 * 60 * 1000),
      },
      {
        threadId: thread1.id,
        senderId: thomas.id,
        content: "J'ai ajusté ta semaine, focus natation.",
        readBy: JSON.stringify([thomas.id]),
        createdAt: twoHoursAgo,
      },
    ],
  })

  // Thread 2 : Julie ↔ Léa
  const thread2 = await prisma.messageThread.create({
    data: {
      participants: JSON.stringify([julie.id, lea.id]),
      lastMessage: 'Renfo décalé au mardi, ok pour toi ?',
      lastAt: yesterdayAt9,
    },
  })
  await prisma.message.createMany({
    data: [
      {
        threadId: thread2.id,
        senderId: julie.id,
        content: 'Salut Léa, le renfo de lundi est décalé au mardi matin 9h. Ok pour toi ?',
        readBy: JSON.stringify([julie.id]),
        createdAt: new Date(yesterdayAt9.getTime() - 5 * 60 * 1000),
      },
      {
        threadId: thread2.id,
        senderId: julie.id,
        content: 'Renfo décalé au mardi, ok pour toi ?',
        readBy: JSON.stringify([julie.id]),
        createdAt: yesterdayAt9,
      },
    ],
  })

  // Thread 3 : Groupe Half La Baule (Léa + Sofia + Marc)
  const thread3 = await prisma.messageThread.create({
    data: {
      participants: JSON.stringify([lea.id, sofia.id, marc.id]),
      groupName: 'Groupe Half La Baule',
      lastMessage: 'Sofia : sortie longue dimanche ?',
      lastAt: twoDaysAgo,
    },
  })
  await prisma.message.createMany({
    data: [
      {
        threadId: thread3.id,
        senderId: sofia.id,
        content: 'Sortie longue dimanche matin ? Je pars à 7h de la place du commerce.',
        readBy: JSON.stringify([sofia.id, lea.id, marc.id]),
        createdAt: new Date(twoDaysAgo.getTime() - 60 * 60 * 1000),
      },
      {
        threadId: thread3.id,
        senderId: marc.id,
        content: 'Présent ! On fait combien de km ?',
        readBy: JSON.stringify([marc.id]),
        createdAt: new Date(twoDaysAgo.getTime() - 30 * 60 * 1000),
      },
      {
        threadId: thread3.id,
        senderId: sofia.id,
        content: 'Sofia : sortie longue dimanche ?',
        readBy: JSON.stringify([sofia.id]),
        createdAt: twoDaysAgo,
      },
    ],
  })

  console.log('3 threads de messages créés')

  // =====================================================
  // 10. Séances du club (ClubSessions)
  // =====================================================
  await prisma.clubSessionRegistration.deleteMany({ where: { session: { clubId: club.id } } })
  await prisma.clubSession.deleteMany({ where: { clubId: club.id } })

  // Dates dynamiques : prochains créneaux
  function nextWeekday(targetDay: number): Date {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    const current = d.getDay() // 0=Sun, 1=Mon, ...
    const diff = (targetDay - current + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d
  }

  const nextTuesday  = nextWeekday(2)
  const nextThursday = nextWeekday(4)
  const nextSunday   = nextWeekday(0)

  const swimTuesday = await prisma.clubSession.create({
    data: {
      clubId: club.id, coachId: thomas.id,
      title: 'Créneau natation · mardi soir', sport: 'swim',
      date: nextTuesday, startTime: '19:00', endTime: '20:30',
      location: 'Piscine du Petit Port · lignes 4-5', capacity: 16,
    },
  })
  const swimThursday = await prisma.clubSession.create({
    data: {
      clubId: club.id, coachId: thomas.id,
      title: 'Créneau natation · jeudi midi', sport: 'swim',
      date: nextThursday, startTime: '12:30', endTime: '13:45',
      location: 'Piscine Léo Lagrange · ligne 3', capacity: 8,
    },
  })
  const bikeSunday = await prisma.clubSession.create({
    data: {
      clubId: club.id, coachId: thomas.id,
      title: 'Sortie vélo du dimanche', sport: 'bike',
      date: nextSunday, startTime: '08:00', endTime: '10:30',
      location: 'Départ local TCN · 70 km', capacity: 20,
    },
  })
  const runThursday = await prisma.clubSession.create({
    data: {
      clubId: club.id, coachId: thomas.id,
      title: 'Piste · fractionné collectif', sport: 'run',
      date: nextThursday, startTime: '18:30', endTime: '20:00',
      location: 'Stade Mangin · piste', capacity: 15,
    },
  })

  // Inscriptions (Léa inscrite à swim mardi + vélo dimanche)
  await prisma.clubSessionRegistration.createMany({
    data: [
      { sessionId: swimTuesday.id,  userId: lea.id,    waitlist: false },
      { sessionId: swimTuesday.id,  userId: marc.id,   waitlist: false },
      { sessionId: swimTuesday.id,  userId: sofia.id,  waitlist: false },
      { sessionId: swimTuesday.id,  userId: helene.id, waitlist: false },
      { sessionId: swimThursday.id, userId: sofia.id,  waitlist: false },
      { sessionId: swimThursday.id, userId: marc.id,   waitlist: false },
      { sessionId: bikeSunday.id,   userId: lea.id,    waitlist: false },
      { sessionId: bikeSunday.id,   userId: sofia.id,  waitlist: false },
      { sessionId: bikeSunday.id,   userId: marc.id,   waitlist: false },
      { sessionId: runThursday.id,  userId: sofia.id,  waitlist: false },
      { sessionId: runThursday.id,  userId: yanis.id,  waitlist: false },
    ],
  })
  console.log('4 séances club créées avec inscriptions')

  // =====================================================
  // 11. Invitations (Admin CODIR — Marie Lemoine)
  // =====================================================
  await prisma.invitation.deleteMany({ where: { clubId: club.id } })

  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  await prisma.invitation.createMany({
    data: [
      {
        clubId: club.id, invitedById: marie.id,
        email: 'camille.durand@email.fr', firstName: 'Camille', lastName: 'Durand',
        role: 'athlete', groupName: 'Découverte', expiresAt: in7days,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        clubId: club.id, invitedById: marie.id,
        email: 'noe.renaud@email.fr', firstName: 'Noé', lastName: 'Renaud',
        role: 'athlete', groupName: null, expiresAt: in7days,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        clubId: club.id, invitedById: thomas.id,
        email: 'hugo.masson@email.fr', firstName: 'Hugo', lastName: 'Masson',
        role: 'coach', groupName: null, expiresAt: in7days,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  })
  console.log('3 invitations CODIR créées (Camille, Noé, Hugo)')

  // =====================================================
  // 12. Objectifs de saison
  // =====================================================
  await prisma.seasonGoal.deleteMany({ where: { userId: lea.id } })
  await prisma.seasonGoal.createMany({
    data: [
      { userId: lea.id, sport: 'swim', year: 2026, type: 'distance', targetValue: 50,   unit: 'km',       label: 'Distance natation' },
      { userId: lea.id, sport: 'bike', year: 2026, type: 'distance', targetValue: 2000, unit: 'km',       label: 'Distance vélo' },
      { userId: lea.id, sport: 'run',  year: 2026, type: 'distance', targetValue: 500,  unit: 'km',       label: 'Distance course à pied' },
      { userId: lea.id, sport: 'all',  year: 2026, type: 'sessions', targetValue: 150,  unit: 'sessions', label: 'Séances totales' },
    ],
  })
  console.log('4 objectifs de saison créés')

  // =====================================================
  // Résumé
  // =====================================================
  console.log('\n========================================')
  console.log('COMPTES DÉMO PRÊTS')
  console.log('========================================')
  console.log('Athlète  : demo@triathlon-planner.fr / demo1234')
  console.log('Coach    : thomas.mercier@triathlon-nantes.fr / coach1234')
  console.log('Admin    : marie.lemoine@triathlon-nantes.fr / admin1234')
  console.log('')
  console.log('Contenu :')
  console.log(`  - ${competitions.length} compétitions Léa (2 passées, 3 futures A/B/C)`)
  console.log('  - 3 plans (Triathlon Nantes sem.6/12, Natation, Vélo)')
  console.log('  - 1 suggestion coach envoyée (bannière orange visible)')
  console.log('  - 3 threads de messages (Direction + Groupes)')
  console.log('  - Club "Triathlon Club Nantais" (Marie=admin, Thomas=coach, 14 athlètes)')
  console.log('  - 4 groupes d\'entraînement avec athlètes')
  console.log('  - 4 séances club (swim x2, bike, run) avec inscriptions')
  console.log('  - 3 invitations CODIR en attente')
  console.log('  - Wellness 42j pour Léa, Marc, Sofia')
  console.log('========================================')
}

// --- Helpers ---

function getMonday(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function getRandomNote(type: string): string | undefined {
  if (Math.random() > 0.4) return undefined
  const notes: Record<string, string[]> = {
    swim: ['Bonnes sensations dans l\'eau', 'Travail sur le roulis OK', 'Meilleur chrono au 400m !'],
    bike: ['Vent de face au retour', 'Bonnes jambes, cadence élevée', 'Nouveau record sur le segment'],
    run: ['Legs lourdes au début puis ça s\'est débloqué', 'Bonne séance, allures respectées'],
    strength: ['Gainage + squats OK', 'Ajout de poids sur les fentes'],
    brick: ['Transition fluide, jambes OK après le vélo'],
    rest: [],
  }
  const pool = notes[type] || []
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
