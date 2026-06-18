import prisma from '../../config/database.js'

type Level = 'beginner' | 'intermediate' | 'advanced'
type Phase = 'base' | 'build' | 'peak' | 'taper'
type SessionType = 'swim' | 'bike' | 'run' | 'strength' | 'rest' | 'brick'
type Intensity = 'easy' | 'moderate' | 'hard' | 'interval' | 'race-pace'

interface SessionTemplate {
  dayOfWeek: number
  type: SessionType
  title: string
  duration: number
  distance?: number
  intensity: Intensity
  descriptionFn: (phase: Phase, level: Level) => string
}

// --- Periodization config per level ---

const PERIODIZATION: Record<Level, { base: number; build: number; peak: number; taper: number }> = {
  beginner:     { base: 0.40, build: 0.40, peak: 0.10, taper: 0.10 },
  intermediate: { base: 0.30, build: 0.40, peak: 0.15, taper: 0.15 },
  advanced:     { base: 0.25, build: 0.35, peak: 0.25, taper: 0.15 },
}

const VOLUME_MULTIPLIERS: Record<Level, Record<Phase, number>> = {
  beginner:     { base: 0.6, build: 0.8,  peak: 0.9, taper: 0.5 },
  intermediate: { base: 0.7, build: 0.9,  peak: 1.0, taper: 0.5 },
  advanced:     { base: 0.8, build: 1.0,  peak: 1.1, taper: 0.6 },
}

// --- Description helpers ---

function runDesc(title: string, detail: string, tip: string) {
  return (phase: Phase, level: Level) => {
    const phaseGoals: Record<Phase, string> = {
      base: 'Construire une base aerobie solide et habituer le corps a courir regulierement',
      build: 'Augmenter progressivement le volume et introduire du travail de qualite',
      peak: 'Atteindre le pic de forme avec des seances specifiques a l\'objectif',
      taper: 'Reduire le volume tout en maintenant l\'intensite pour arriver frais le jour J',
    }
    const warmup = level === 'beginner'
      ? '10 min de marche rapide puis footing tres lent'
      : level === 'intermediate'
      ? '10 min de footing lent + gammes (montees de genoux, talons-fesses)'
      : '15 min de footing progressif + gammes dynamiques + accelerations'
    const cooldown = level === 'beginner'
      ? '5 min de marche puis etirements doux (30s par groupe musculaire)'
      : '10 min de footing lent + etirements + automassage si besoin'
    const tipByLevel = level === 'beginner' ? tip : ''

    return [
      `Objectif : ${phaseGoals[phase]}`,
      `Echauffement : ${warmup}`,
      `Seance : ${detail}`,
      `Retour au calme : ${cooldown}`,
      tipByLevel ? `Conseil : ${tipByLevel}` : '',
    ].filter(Boolean).join('\n')
  }
}

function swimDesc(title: string, detail: string, tip: string) {
  return (phase: Phase, level: Level) => {
    const warmup = level === 'beginner'
      ? '200m nage libre tranquille + 4x50m educatifs (rattrapé, bras tendus)'
      : level === 'intermediate'
      ? '400m varie (crawl, dos) + 4x50m educatifs + 4x25m sprints'
      : '600m varie + 8x50m educatifs progressifs + 4x25m sprints'
    const cooldown = level === 'beginner'
      ? '100m dos tranquille + etirements bras et epaules'
      : '200m retour au calme + etirements complets'
    const tipByLevel = level === 'beginner' ? tip : ''

    return [
      `Objectif : Ameliorer la technique et l'endurance en natation (phase ${phase})`,
      `Echauffement : ${warmup}`,
      `Seance : ${detail}`,
      `Retour au calme : ${cooldown}`,
      tipByLevel ? `Conseil : ${tipByLevel}` : '',
    ].filter(Boolean).join('\n')
  }
}

function bikeDesc(title: string, detail: string, tip: string) {
  return (phase: Phase, level: Level) => {
    const warmup = level === 'beginner'
      ? '10 min de pedalage souple a faible resistance'
      : level === 'intermediate'
      ? '15 min progressif + quelques accelerations de 30s'
      : '15 min progressif + 3x1min en force + 3x30s en velocite'
    const cooldown = level === 'beginner'
      ? '5 min de pedalage tres leger + etirements quadriceps et ischio-jambiers'
      : '10 min souple + etirements complets du bas du corps'
    const tipByLevel = level === 'beginner' ? tip : ''

    return [
      `Objectif : Developper la puissance et l'endurance a velo (phase ${phase})`,
      `Echauffement : ${warmup}`,
      `Seance : ${detail}`,
      `Retour au calme : ${cooldown}`,
      tipByLevel ? `Conseil : ${tipByLevel}` : '',
    ].filter(Boolean).join('\n')
  }
}

// --- Templates by discipline x level ---

// RUNNING templates
function getRunningTemplates(level: Level): SessionTemplate[] {
  if (level === 'beginner') {
    return [
      { dayOfWeek: 2, type: 'run', title: 'Footing facile', duration: 30, distance: 4, intensity: 'easy',
        descriptionFn: runDesc('Footing facile', 'Alternez 5 min de course lente et 1 min de marche si besoin. Objectif : courir 30 min sans forcer. Restez a une allure ou vous pouvez parler.', 'Si vous etes essouffle, ralentissez ou marchez. Il vaut mieux courir lentement que s\'arreter.') },
      { dayOfWeek: 4, type: 'strength', title: 'Renforcement debutant', duration: 30, intensity: 'easy',
        descriptionFn: (_p, _l) => 'Objectif : Renforcer les muscles stabilisateurs pour prevenir les blessures\nEchauffement : 5 min de mobilite articulaire (chevilles, genoux, hanches)\nSeance : 3 tours de : 10 squats + 10 fentes alternees + 30s gainage ventral + 30s gainage lateral (chaque cote) + 10 montees sur pointes. 1 min de repos entre les tours.\nRetour au calme : Etirements doux 5 min\nConseil : Concentrez-vous sur la qualite du mouvement plutot que la vitesse.' },
      { dayOfWeek: 7, type: 'run', title: 'Sortie longue', duration: 45, distance: 6, intensity: 'easy',
        descriptionFn: runDesc('Sortie longue', 'Course continue a allure tres confortable. Vous devez pouvoir tenir une conversation. Augmentez progressivement la duree chaque semaine (+5 min).', 'Hydratez-vous avant et apres. Commencez toujours plus lentement que vous ne le pensez.') },
    ]
  }
  if (level === 'intermediate') {
    return [
      { dayOfWeek: 1, type: 'run', title: 'Footing recuperation', duration: 35, distance: 6, intensity: 'easy',
        descriptionFn: runDesc('Footing recuperation', 'Course tres facile, en zone 1-2. Pas de montre, pas de chrono, juste du plaisir.', '') },
      { dayOfWeek: 2, type: 'run', title: 'Fractionne court', duration: 50, distance: 9, intensity: 'interval',
        descriptionFn: runDesc('Fractionne court', '8x400m a allure 5K avec 1min30 de recuperation trot entre chaque. Visez une allure reguliere.', '') },
      { dayOfWeek: 3, type: 'strength', title: 'Renforcement / PPG', duration: 40, intensity: 'moderate',
        descriptionFn: (_p, _l) => 'Objectif : Renforcement musculaire specifique course a pied\nEchauffement : 10 min mobilite + gammes\nSeance : 4 tours de : 12 squats unipodaux + 12 fentes marchees + 45s gainage ventral + 30s chaise + 15 hip thrusts. Repos 1 min entre les tours.\nRetour au calme : Etirements 10 min' },
      { dayOfWeek: 5, type: 'run', title: 'Tempo / Seuil', duration: 55, distance: 11, intensity: 'moderate',
        descriptionFn: runDesc('Tempo / Seuil', '20 min au seuil (allure semi-marathon) encadrees de footing facile. Le seuil = allure "inconfortablement confortable".', '') },
      { dayOfWeek: 7, type: 'run', title: 'Sortie longue', duration: 80, distance: 14, intensity: 'easy',
        descriptionFn: runDesc('Sortie longue', 'Course longue a allure endurance fondamentale. Les 3 derniers km en progression legere si les sensations sont bonnes.', '') },
    ]
  }
  // advanced
  return [
    { dayOfWeek: 1, type: 'run', title: 'Footing recuperation', duration: 40, distance: 8, intensity: 'easy',
      descriptionFn: runDesc('Footing recuperation', 'Footing de regeneration en endurance fondamentale basse.', '') },
    { dayOfWeek: 2, type: 'run', title: 'VMA / Fractionne court', duration: 60, distance: 12, intensity: 'hard',
      descriptionFn: runDesc('VMA / Fractionne court', '12x400m a 100% VMA, recuperation 1min trot. Puis 4x200m a 105% VMA, recuperation 45s.', '') },
    { dayOfWeek: 3, type: 'run', title: 'Footing + cotes', duration: 50, distance: 10, intensity: 'moderate',
      descriptionFn: runDesc('Footing + cotes', '40 min de footing vallonne avec 8 cotes de 30-45s a intensite haute. Recup en descente.', '') },
    { dayOfWeek: 4, type: 'strength', title: 'Renforcement intensif', duration: 45, intensity: 'hard',
      descriptionFn: (_p, _l) => 'Objectif : Renforcement et prevention des blessures\nEchauffement : 10 min dynamique\nSeance : 4 tours de : 10 squats sautes + 10 fentes sautees + 45s gainage dynamique + 15 hip thrusts lestes + box jumps 8 reps. Repos 1 min.\nRetour au calme : Etirements + foam roller' },
    { dayOfWeek: 5, type: 'run', title: 'Seuil / Allure specifique', duration: 65, distance: 13, intensity: 'hard',
      descriptionFn: runDesc('Seuil / Allure specifique', '2x20 min au seuil (allure semi) avec 3 min de recuperation entre les blocs. Finir par 4x200m rapide.', '') },
    { dayOfWeek: 6, type: 'run', title: 'Footing aerobie', duration: 45, distance: 9, intensity: 'easy',
      descriptionFn: runDesc('Footing aerobie', 'Footing de regeneration avec 5 lignes droites en acceleration progressive en fin de seance.', '') },
    { dayOfWeek: 7, type: 'run', title: 'Sortie longue', duration: 105, distance: 19, intensity: 'easy',
      descriptionFn: runDesc('Sortie longue', 'Sortie longue en endurance fondamentale. Derniers 20 min en progression vers allure marathon.', '') },
  ]
}

// TRIATHLON templates
function getTriathlonTemplates(level: Level, targetType: string): SessionTemplate[] {
  const isSprint = targetType.includes('sprint')
  const isOlympic = targetType.includes('olympic')
  const isHalf = targetType.includes('half-ironman') || targetType.includes('70.3')

  if (level === 'beginner') {
    return [
      { dayOfWeek: 1, type: 'swim', title: 'Natation technique', duration: 40, distance: 1.2, intensity: 'moderate',
        descriptionFn: swimDesc('Natation technique', 'Focus technique : 4x100m crawl en pensant a la rotation des epaules + 4x50m rattrapé + 200m nage complète. Repos 20s entre chaque serie.', 'Ne cherchez pas la vitesse, concentrez-vous sur le glissement dans l\'eau. Expirez sous l\'eau par le nez.') },
      { dayOfWeek: 2, type: 'run', title: 'Footing facile', duration: 30, distance: 4, intensity: 'easy',
        descriptionFn: runDesc('Footing facile', '30 min de course a allure conversationnelle. Alternez course et marche si besoin.', 'Courir lentement est le meilleur moyen de progresser. La patience est cle en triathlon.') },
      { dayOfWeek: 4, type: 'bike', title: 'Velo endurance', duration: 45, distance: 18, intensity: 'easy',
        descriptionFn: bikeDesc('Velo endurance', '45 min de pedalage regulier a cadence confortable (80-90 rpm). Restez assis, pedalage rond.', 'Gardez une cadence elevee (80+ rpm) plutot que de forcer sur un gros braquet. Vos genoux vous remercieront.') },
      { dayOfWeek: 6, type: 'bike', title: 'Sortie longue velo', duration: 75, distance: 30, intensity: 'easy',
        descriptionFn: bikeDesc('Sortie longue velo', 'Sortie longue a allure confortable. Pensez a boire toutes les 15 min. Profitez du paysage !', 'Mangez et buvez pendant les sorties de plus d\'1h. Votre corps a besoin de carburant.') },
    ]
  }
  if (level === 'intermediate') {
    const sessions: SessionTemplate[] = [
      { dayOfWeek: 1, type: 'swim', title: 'Natation technique', duration: 50, distance: 2.0, intensity: 'moderate',
        descriptionFn: swimDesc('Natation technique', '8x100m crawl technique (2 rattrapé, 2 bras tendu, 2 poing fermé, 2 normal) r=15s + 4x200m allure soutenue r=20s.', '') },
      { dayOfWeek: 2, type: 'run', title: 'Fractionne', duration: 50, distance: 9, intensity: 'interval',
        descriptionFn: runDesc('Fractionne', '6x800m a allure 10K avec 1min30 recuperation trot. Cible : regularite des fractions.', '') },
      { dayOfWeek: 3, type: 'bike', title: 'Velo intervalles', duration: 70, distance: 30, intensity: 'hard',
        descriptionFn: bikeDesc('Velo intervalles', '5x5min en zone 4 (seuil) avec 3min recuperation souple. Maintenez une cadence de 85-95 rpm.', '') },
      { dayOfWeek: 4, type: 'swim', title: 'Natation endurance', duration: 55, distance: 2.5, intensity: 'moderate',
        descriptionFn: swimDesc('Natation endurance', '800m continu + 6x150m progressif (lent-moyen-rapide par 50m) r=20s + 400m souple.', '') },
      { dayOfWeek: 5, type: 'run', title: 'Footing aerobie', duration: 40, distance: 7, intensity: 'easy',
        descriptionFn: runDesc('Footing aerobie', 'Footing de regeneration en endurance fondamentale. Terminez par 4 lignes droites.', '') },
      { dayOfWeek: 6, type: 'bike', title: 'Sortie longue velo', duration: 120, distance: 50, intensity: 'easy',
        descriptionFn: bikeDesc('Sortie longue velo', 'Sortie longue a allure endurance. Travaillez la nutrition (manger/boire toutes les 20 min). Dernieres 15 min en progression.', '') },
    ]
    if (!isSprint) {
      sessions.push({ dayOfWeek: 7, type: 'run', title: 'Course longue', duration: 70, distance: 12, intensity: 'easy',
        descriptionFn: runDesc('Course longue', 'Sortie longue a allure facile. Pour les triathletes : enchainez apres un court velo si possible (brick).', '') })
    }
    return sessions
  }
  // advanced
  const sessions: SessionTemplate[] = [
    { dayOfWeek: 1, type: 'swim', title: 'Natation seuil', duration: 60, distance: 3.0, intensity: 'hard',
      descriptionFn: swimDesc('Natation seuil', '5x400m au seuil r=20s + 8x50m sprint r=15s. Visez un chrono regulier sur chaque 400m.', '') },
    { dayOfWeek: 2, type: 'bike', title: 'Velo seuil', duration: 90, distance: 40, intensity: 'hard',
      descriptionFn: bikeDesc('Velo seuil', '3x15min au seuil (zone 4) avec 5min recuperation. Cadence 90-100 rpm.', '') },
    { dayOfWeek: 3, type: 'run', title: 'Fractionne long', duration: 65, distance: 13, intensity: 'interval',
      descriptionFn: runDesc('Fractionne long', '4x2000m a allure 10K avec 2min recuperation trot + 4x400m rapide r=1min.', '') },
    { dayOfWeek: 4, type: 'swim', title: 'Natation endurance', duration: 55, distance: 2.8, intensity: 'moderate',
      descriptionFn: swimDesc('Natation endurance', '1500m continu allure course + 6x100m technique + 400m souple.', '') },
    { dayOfWeek: 5, type: 'brick', title: 'Enchainement velo-course', duration: 90, distance: undefined, intensity: 'hard',
      descriptionFn: (_p, _l) => 'Objectif : Travailler la transition velo-course et les sensations d\'enchainement\nEchauffement : 10 min velo souple\nSeance : 45 min velo a allure course puis enchainement rapide (T2) + 30 min course a allure cible. Focus sur les sensations de jambes lourdes au debut de la course.\nRetour au calme : 5 min marche + etirements complets\nConseil : Preparez votre transition avant de partir : chaussures, dossard, nutrition.' },
    { dayOfWeek: 6, type: 'bike', title: 'Sortie longue velo', duration: 150, distance: 65, intensity: 'easy',
      descriptionFn: bikeDesc('Sortie longue velo', 'Sortie longue endurance fondamentale. Travaillez votre plan nutrition course. 20 dernières min en progression vers allure cible.', '') },
    { dayOfWeek: 7, type: 'run', title: 'Course longue', duration: 90, distance: 16, intensity: 'easy',
      descriptionFn: runDesc('Course longue', 'Sortie longue progressive : 60% a allure facile, 30% a allure marathon, 10% a allure semi.', '') },
  ]
  return sessions
}

// SWIMMING templates
function getSwimmingTemplates(level: Level): SessionTemplate[] {
  if (level === 'beginner') {
    return [
      { dayOfWeek: 2, type: 'swim', title: 'Technique crawl', duration: 40, distance: 1.0, intensity: 'easy',
        descriptionFn: swimDesc('Technique crawl', '8x25m educatifs (rattrapé, bras tendus, water-polo) + 4x50m crawl souple r=20s + 200m au choix.', 'Prenez votre temps, la technique est plus importante que la distance. Pensez a expirer sous l\'eau.') },
      { dayOfWeek: 5, type: 'swim', title: 'Endurance natation', duration: 40, distance: 1.2, intensity: 'moderate',
        descriptionFn: swimDesc('Endurance natation', '400m continu (faites des pauses si besoin) + 4x100m avec 15s repos + 4x50m dos pour varier.', 'Comptez vos coups de bras par longueur et essayez de reduire ce nombre au fil des semaines.') },
    ]
  }
  if (level === 'intermediate') {
    return [
      { dayOfWeek: 1, type: 'swim', title: 'Technique et vitesse', duration: 55, distance: 2.2, intensity: 'moderate',
        descriptionFn: swimDesc('Technique et vitesse', '6x100m educatifs + 6x100m progressif (1-2-3-4-5-6 de plus en plus vite) r=15s + 4x50m sprint r=30s.', '') },
      { dayOfWeek: 3, type: 'swim', title: 'Seuil natation', duration: 50, distance: 2.0, intensity: 'hard',
        descriptionFn: swimDesc('Seuil natation', '5x200m au seuil r=20s + 10x50m descente (chaque 50 plus rapide) r=10s.', '') },
      { dayOfWeek: 5, type: 'swim', title: 'Endurance longue', duration: 60, distance: 2.8, intensity: 'moderate',
        descriptionFn: swimDesc('Endurance longue', '1000m continu + 4x200m pull buoy r=15s + 4x100m jambes + 200m retour au calme.', '') },
    ]
  }
  // advanced
  return [
    { dayOfWeek: 1, type: 'swim', title: 'Vitesse et puissance', duration: 60, distance: 3.0, intensity: 'hard',
      descriptionFn: swimDesc('Vitesse et puissance', '8x100m progressif r=10s + 5x200m au seuil r=15s + 8x50m sprint depart plonge r=30s.', '') },
    { dayOfWeek: 2, type: 'swim', title: 'Endurance specifique', duration: 65, distance: 3.5, intensity: 'moderate',
      descriptionFn: swimDesc('Endurance specifique', '2000m continu chrono + 8x100m pull buoy progressif + 4x50m sprints.', '') },
    { dayOfWeek: 4, type: 'swim', title: 'Seuil et technique', duration: 55, distance: 2.8, intensity: 'hard',
      descriptionFn: swimDesc('Seuil et technique', '4x400m au seuil r=20s (visez regularite) + 6x50m educatifs + 200m retour au calme.', '') },
    { dayOfWeek: 5, type: 'swim', title: 'Recup active + technique', duration: 45, distance: 2.0, intensity: 'easy',
      descriptionFn: swimDesc('Recup active', 'Seance 100% technique : 4 nages, educatifs variés, travail de coulées. Aucune intensite.', '') },
    { dayOfWeek: 6, type: 'swim', title: 'Endurance longue', duration: 70, distance: 4.0, intensity: 'moderate',
      descriptionFn: swimDesc('Endurance longue', '3000m continu + 4x200m progressif + 400m retour au calme souple.', '') },
  ]
}

// CYCLING templates
function getCyclingTemplates(level: Level): SessionTemplate[] {
  if (level === 'beginner') {
    return [
      { dayOfWeek: 2, type: 'bike', title: 'Velo endurance', duration: 45, distance: 18, intensity: 'easy',
        descriptionFn: bikeDesc('Velo endurance', '45 min de pedalage regulier. Gardez une cadence de 80-90 rpm. Terrain plat de preference.', 'Reglez bien votre selle (jambe presque tendue en bas de pedalage). Un mauvais reglage = douleurs aux genoux.') },
      { dayOfWeek: 4, type: 'bike', title: 'Velo technique', duration: 50, distance: 20, intensity: 'moderate',
        descriptionFn: bikeDesc('Velo technique', '50 min avec travail de cadence : alternez 5 min a 80 rpm et 5 min a 100 rpm. Pedalage rond et souple.', 'En montee, restez assis et baissez le braquet plutot que de vous mettre en danseuse. Economisez vos forces.') },
      { dayOfWeek: 7, type: 'bike', title: 'Sortie longue', duration: 90, distance: 35, intensity: 'easy',
        descriptionFn: bikeDesc('Sortie longue', 'Sortie longue a allure tres confortable. Pensez a boire regulierement. Profitez du parcours !', 'Emportez toujours de l\'eau et un en-cas pour les sorties de plus d\'1h. Prevoyez un kit de reparation crevaison.') },
    ]
  }
  if (level === 'intermediate') {
    return [
      { dayOfWeek: 1, type: 'bike', title: 'Recuperation active', duration: 40, distance: 16, intensity: 'easy',
        descriptionFn: bikeDesc('Recuperation active', 'Pedalage souple en zone 1. Cadence elevee (95+rpm), resistance tres faible. Objectif : faire tourner les jambes.', '') },
      { dayOfWeek: 2, type: 'bike', title: 'Intervalles seuil', duration: 75, distance: 32, intensity: 'hard',
        descriptionFn: bikeDesc('Intervalles seuil', '6x4min au seuil (zone 4) avec 3min recuperation souple. Maintenez une cadence de 90-95 rpm. Derniere serie a fond !', '') },
      { dayOfWeek: 4, type: 'strength', title: 'Renforcement cycliste', duration: 40, intensity: 'moderate',
        descriptionFn: (_p, _l) => 'Objectif : Renforcement specifique velo\nEchauffement : 10 min mobilite\nSeance : 4 tours de : 15 squats + 12 fentes bulgares/cote + 45s gainage + 12 step-ups + 15 mollets. Repos 1 min.\nRetour au calme : Etirements 10 min focus quadriceps, ischio-jambiers, psoas' },
      { dayOfWeek: 6, type: 'bike', title: 'Sortie vallonnee', duration: 90, distance: 40, intensity: 'moderate',
        descriptionFn: bikeDesc('Sortie vallonnee', 'Parcours vallonne avec travail en cotes : chaque bosse en force (assis, gros braquet). Recup en descente. Ciblez 1000m de denivele+.', '') },
      { dayOfWeek: 7, type: 'bike', title: 'Sortie longue', duration: 150, distance: 65, intensity: 'easy',
        descriptionFn: bikeDesc('Sortie longue', 'Sortie longue en endurance fondamentale. Travaillez votre nutrition embarquee. Terminez les 20 dernieres min en progression.', '') },
    ]
  }
  // advanced
  return [
    { dayOfWeek: 1, type: 'bike', title: 'Recuperation active', duration: 45, distance: 18, intensity: 'easy',
      descriptionFn: bikeDesc('Recuperation active', 'Pedalage souple zone 1. Travail de velocite : maintenir 100+ rpm sans rebondir.', '') },
    { dayOfWeek: 2, type: 'bike', title: 'Intervalles VO2max', duration: 80, distance: 35, intensity: 'hard',
      descriptionFn: bikeDesc('Intervalles VO2max', '8x3min a VO2max (zone 5) r=3min souple. Cadence 95-105 rpm. Terminez par 2x1min sprint.', '') },
    { dayOfWeek: 3, type: 'bike', title: 'Tempo / Sweet spot', duration: 75, distance: 32, intensity: 'moderate',
      descriptionFn: bikeDesc('Tempo / Sweet spot', '2x20min en sweet spot (88-93% FTP) avec 5min recuperation. Cadence cible 85-95 rpm.', '') },
    { dayOfWeek: 4, type: 'strength', title: 'Renforcement intensif', duration: 45, intensity: 'hard',
      descriptionFn: (_p, _l) => 'Objectif : Force et explosivite pour le velo\nEchauffement : 10 min dynamique\nSeance : 4 tours de : 10 squats sautes + 10 fentes sautees + 45s gainage dynamique + box jumps 8 reps + 10 deadlifts. Repos 90s.\nRetour au calme : Etirements + foam roller' },
    { dayOfWeek: 5, type: 'bike', title: 'Sortie vallonnee intense', duration: 100, distance: 45, intensity: 'hard',
      descriptionFn: bikeDesc('Sortie vallonnee intense', 'Parcours montagneux. Chaque bosse a fond (assis puis danseuse). Descentes techniques. Ciblez 1500m D+.', '') },
    { dayOfWeek: 6, type: 'bike', title: 'Sortie longue', duration: 210, distance: 95, intensity: 'easy',
      descriptionFn: bikeDesc('Sortie longue', 'Sortie tres longue en endurance. Testez votre nutrition course (gels, barres, boisson). Progressez les 30 dernieres min.', '') },
  ]
}

// --- Target type → template selection ---

function getBaseWeekTemplate(targetType: string, level: Level): SessionTemplate[] {
  const type = targetType.toLowerCase()

  // Triathlon types
  if (type.includes('sprint') || type.includes('olympic') || type.includes('ironman') || type.includes('half') || type.includes('triathlon') || type.includes('70.3')) {
    return getTriathlonTemplates(level, type)
  }
  // Running types
  if (type.includes('5k') || type.includes('10k') || type.includes('marathon') || type.includes('semi') || type.includes('trail') || type.includes('running')) {
    return getRunningTemplates(level)
  }
  // Cycling types
  if (type.includes('cycling') || type.includes('bike') || type.includes('velo') || type.includes('vélo')) {
    return getCyclingTemplates(level)
  }
  // Swimming types
  if (type.includes('swim') || type.includes('natation')) {
    return getSwimmingTemplates(level)
  }

  // Default to triathlon
  return getTriathlonTemplates(level, type)
}

// --- Distance multipliers ---

function getDistanceMultiplier(targetType: string): number {
  const type = targetType.toLowerCase()

  if (type.includes('ironman') && !type.includes('half')) return 1.5
  if (type.includes('half-ironman') || type.includes('70.3')) return 1.2
  if (type.includes('olympic')) return 1.0
  if (type.includes('sprint')) return 0.7

  if (type.includes('marathon') && !type.includes('semi') && !type.includes('half')) return 1.3
  if (type.includes('semi') || (type.includes('half') && type.includes('marathon'))) return 1.0
  if (type.includes('trail')) return 1.1
  if (type.includes('10k')) return 0.7
  if (type.includes('5k')) return 0.5

  return 1.0
}

// --- Phase calculation with level-based periodization ---

function getPhaseForWeek(weekNumber: number, totalWeeks: number, level: Level): Phase {
  const progress = weekNumber / totalWeeks
  const periods = PERIODIZATION[level]

  if (progress <= periods.base) return 'base'
  if (progress <= periods.base + periods.build) return 'build'
  if (progress <= periods.base + periods.build + periods.peak) return 'peak'
  return 'taper'
}

// --- Main generator ---

export async function generateSessionsForPlan(
  planId: number,
  targetType: string,
  durationWeeks: number,
  startDate: Date,
  level: Level = 'intermediate'
): Promise<number> {
  // Delete existing sessions for this plan
  await prisma.trainingSession.deleteMany({ where: { planId } })

  const baseWeek = getBaseWeekTemplate(targetType, level)
  const distanceMultiplier = getDistanceMultiplier(targetType)
  const sessionsToCreate: Array<{
    planId: number
    weekNumber: number
    dayOfWeek: number
    date: Date
    type: string
    title: string
    duration: number
    distance: number | null
    intensity: string
    description: string | null
  }> = []

  const phaseLabels: Record<Phase, string> = {
    base: 'Base',
    build: 'Construction',
    peak: 'Pic',
    taper: 'Affutage',
  }

  for (let week = 1; week <= durationWeeks; week++) {
    const phase = getPhaseForWeek(week, durationWeeks, level)
    const volumeMultiplier = VOLUME_MULTIPLIERS[level][phase]

    for (const session of baseWeek) {
      // Calculate session date
      const sessionDate = new Date(startDate)
      sessionDate.setDate(sessionDate.getDate() + ((week - 1) * 7) + (session.dayOfWeek - 1))

      // Apply volume multiplier
      const adjustedDuration = Math.round(session.duration * volumeMultiplier)
      const adjustedDistance = session.distance
        ? Math.round(session.distance * volumeMultiplier * distanceMultiplier * 10) / 10
        : null

      // Adjust intensity for taper
      let adjustedIntensity: string = session.intensity
      if (phase === 'taper' && (session.intensity === 'hard' || session.intensity === 'interval')) {
        adjustedIntensity = 'moderate'
      }

      // Generate detailed description
      const detailedDescription = session.descriptionFn(phase, level)
      const description = `[${phaseLabels[phase]}] ${detailedDescription}`

      sessionsToCreate.push({
        planId,
        weekNumber: week,
        dayOfWeek: session.dayOfWeek,
        date: sessionDate,
        type: session.type,
        title: session.title,
        duration: adjustedDuration,
        distance: adjustedDistance,
        intensity: adjustedIntensity,
        description,
      })
    }
  }

  // Batch create sessions
  await prisma.trainingSession.createMany({ data: sessionsToCreate })

  return sessionsToCreate.length
}

export async function regenerateSessions(planId: number): Promise<number> {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { targetType: true, durationWeeks: true, startDate: true, level: true },
  })

  if (!plan || !plan.startDate) {
    throw new Error('Plan not found or missing start date')
  }

  const level = (plan.level as Level) || 'intermediate'
  return generateSessionsForPlan(planId, plan.targetType, plan.durationWeeks, plan.startDate, level)
}
