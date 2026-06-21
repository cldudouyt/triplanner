import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config/env.js'
import prisma from '../../config/database.js'
import { getTrainingLoad } from '../statistics/statistics.service.js'

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!config.anthropic.apiKey) return null
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: config.anthropic.apiKey })
  }
  return anthropicClient
}

export function isAIAvailable(): boolean {
  return !!config.anthropic.apiKey
}

interface GeneratePlanParams {
  name: string
  targetType: string
  durationWeeks: number
  level: 'beginner' | 'intermediate' | 'advanced'
  weeklyHours?: number
  startDate?: string
  objective?: string
  constraints?: string
  stravaContext?: string
}

interface AISession {
  weekNumber: number
  dayOfWeek: number
  type: string
  title: string
  description: string
  duration: number
  distance?: number
  intensity: string
}

interface AIPlanResponse {
  sessions: AISession[]
}

function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text.trim()
}

export async function generateAIPlan(userId: number, params: GeneratePlanParams) {
  const client = getClient()
  if (!client) {
    throw new Error('AI_NOT_CONFIGURED')
  }

  const levelLabels = {
    beginner: 'debutant',
    intermediate: 'intermediaire',
    advanced: 'avance',
  }

  const systemPrompt = `Tu es un entraineur sportif certifie specialise en triathlon, course a pied, velo et natation. Tu crees des plans d'entrainement periodises et personnalises.

Regles importantes :
- Chaque seance doit avoir une description pedagogique detaillee avec : objectif, echauffement, contenu de seance (exercices precis avec temps/distances), retour au calme, et un conseil pour les debutants.
- Les types de seance valides sont : swim, bike, run, strength, rest, brick
- Les intensites valides sont : easy, moderate, hard, interval, race-pace
- Les jours de la semaine vont de 1 (lundi) a 7 (dimanche)
- Adapte le nombre de seances et le volume au niveau du sportif
- Utilise une periodisation (Base, Construction, Pic, Affutage)
- Reponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication, juste le JSON brut`

  const userPrompt = `Genere un plan d'entrainement avec ces parametres :
- Sport/Objectif : ${params.targetType}
- Niveau : ${levelLabels[params.level]}
- Duree : ${params.durationWeeks} semaines
${params.weeklyHours ? `- Heures disponibles par semaine : ${params.weeklyHours}h` : ''}
${params.objective ? `- Objectif personnel : ${params.objective}` : ''}
${params.constraints ? `- Contraintes : ${params.constraints}` : ''}
${params.stravaContext ? `\n${params.stravaContext}\nAdapte le plan a ces donnees reelles plutot qu'au niveau declare.` : ''}

Reponds en JSON avec ce format exact :
{
  "sessions": [
    {
      "weekNumber": 1,
      "dayOfWeek": 1,
      "type": "run",
      "title": "Footing facile",
      "description": "[Base] Objectif : ...\\nEchauffement : ...\\nSeance : ...\\nRetour au calme : ...\\nConseil : ...",
      "duration": 30,
      "distance": 5.0,
      "intensity": "easy"
    }
  ]
}`

  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const message = await stream.finalMessage()

  const textBlock = message.content.find(b => b.type === 'text')
  const content = textBlock?.type === 'text' ? textBlock.text : ''
  if (!content) {
    throw new Error('AI_EMPTY_RESPONSE')
  }

  let parsed: AIPlanResponse
  try {
    parsed = JSON.parse(extractJSON(content))
  } catch {
    throw new Error('AI_INVALID_RESPONSE')
  }

  if (!parsed.sessions || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
    throw new Error('AI_NO_SESSIONS')
  }

  const startDate = params.startDate ? new Date(params.startDate) : undefined
  const endDate = startDate
    ? new Date(startDate.getTime() + params.durationWeeks * 7 * 24 * 60 * 60 * 1000)
    : undefined

  const plan = await prisma.trainingPlan.create({
    data: {
      name: params.name,
      targetType: params.targetType,
      durationWeeks: params.durationWeeks,
      level: params.level,
      weeklyHours: params.weeklyHours,
      userId,
      startDate,
      endDate,
    },
  })

  const validTypes = ['swim', 'bike', 'run', 'strength', 'rest', 'brick']
  const validIntensities = ['easy', 'moderate', 'hard', 'interval', 'race-pace']

  const sessionsData = parsed.sessions
    .filter(s => s.weekNumber && s.dayOfWeek && s.type && s.title)
    .map(s => {
      const sessionDate = startDate ? new Date(startDate) : undefined
      if (sessionDate) {
        sessionDate.setDate(sessionDate.getDate() + ((s.weekNumber - 1) * 7) + (s.dayOfWeek - 1))
      }

      return {
        planId: plan.id,
        weekNumber: s.weekNumber,
        dayOfWeek: Math.max(1, Math.min(7, s.dayOfWeek)),
        date: sessionDate,
        type: validTypes.includes(s.type) ? s.type : 'run',
        title: s.title,
        description: s.description || null,
        duration: s.duration || 30,
        distance: s.distance || null,
        intensity: validIntensities.includes(s.intensity) ? s.intensity : 'moderate',
      }
    })

  if (sessionsData.length > 0) {
    await prisma.trainingSession.createMany({ data: sessionsData })
  }

  return prisma.trainingPlan.findUnique({
    where: { id: plan.id },
    include: {
      sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
      competitions: {
        include: { competition: { select: { id: true, name: true, date: true, type: true, priority: true } } },
        orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
      },
    },
  })
}

export interface CoachAISuggestion {
  id: string
  title: string
  delta: string
  why: string
  enabled: boolean
}

interface CoachSuggestionsParams {
  athleteName: string
  planName: string
  weekNumber: number
  ctl: number
  tsb: number
  recentWellness?: { fatigue: number; readinessScore: number }
  nextCompetition?: { name: string; daysUntil: number }
}

export async function generateCoachSuggestions(params: CoachSuggestionsParams): Promise<CoachAISuggestion[]> {
  const client = getClient()
  if (!client) {
    // Fallback to default suggestions when AI is not configured
    return [
      { id: 'maintain_load', title: 'Maintien de charge', delta: '±0 min', why: 'Forme stable, continuer le plan prévu', enabled: true },
      { id: 'recovery_day', title: 'Séance récup ajoutée', delta: '+1 séance', why: 'Optimisation récupération active', enabled: false },
    ]
  }

  const systemPrompt = `Tu es un coach triathlon expert. Tu analyses la forme d'un athlète et proposes 3 à 4 ajustements précis pour la semaine à venir. Réponds UNIQUEMENT avec du JSON valide.`

  const tsbStatus = params.tsb > 5 ? 'forme positive (TSB +)' : params.tsb < -10 ? 'surcharge (TSB -)' : 'équilibre (TSB neutre)'
  const readinessLabel = params.recentWellness ? ` · score forme ${params.recentWellness.readinessScore}/100` : ''

  const userPrompt = `Athlète : ${params.athleteName}
Plan : ${params.planName} — Semaine ${params.weekNumber}
CTL (forme de fond) : ${Math.round(params.ctl)}
TSB (fraîcheur) : ${Math.round(params.tsb)} → ${tsbStatus}${readinessLabel}${params.recentWellness ? ` · fatigue ${params.recentWellness.fatigue}/5` : ''}
${params.nextCompetition ? `Prochaine compétition : ${params.nextCompetition.name} dans ${params.nextCompetition.daysUntil} jours` : ''}

Génère 3-4 ajustements de plan pour cette semaine au format :
[
  {
    "id": "slug_unique",
    "title": "Titre court (max 5 mots)",
    "delta": "ex: −30 min ou +1 séance ou ×1.1",
    "why": "Explication courte basée sur les données ci-dessus",
    "enabled": true
  }
]`

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find(b => b.type === 'text')
    const content = textBlock?.type === 'text' ? textBlock.text : ''

    const jsonStr = extractJSON(content.includes('[') ? content : `{"arr":${content}}`)
    let parsed: CoachAISuggestion[]

    if (content.trimStart().startsWith('[')) {
      parsed = JSON.parse(content.trim())
    } else {
      const obj = JSON.parse(jsonStr) as { arr?: CoachAISuggestion[] } | CoachAISuggestion[]
      parsed = Array.isArray(obj) ? obj : (obj as { arr: CoachAISuggestion[] }).arr ?? []
    }

    return parsed.filter(s => s.id && s.title && s.why)
  } catch {
    return [
      { id: 'maintain_load', title: 'Maintien de charge', delta: '±0 min', why: 'Plan stable cette semaine', enabled: true },
    ]
  }
}

export async function buildChatContext(userId: number): Promise<string> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const [nextComp, activePlan, todayWellness, loadData] = await Promise.all([
    prisma.competition.findFirst({
      where: { userId, status: 'planned', date: { gte: now } },
      orderBy: { date: 'asc' },
    }),
    prisma.trainingPlan.findFirst({
      where: { userId, endDate: { gte: now } },
    }),
    prisma.wellnessLog.findFirst({
      where: { userId, date: { gte: startOfDay } },
    }),
    getTrainingLoad(userId, 7),
  ])

  const parts: string[] = []

  if (nextComp) {
    const daysUntil = Math.ceil((new Date(nextComp.date).getTime() - now.getTime()) / 86400000)
    parts.push(`Prochaine compétition : ${nextComp.name} dans ${daysUntil} jours`)
  } else {
    parts.push('Aucune compétition planifiée prochainement')
  }

  if (activePlan) {
    const planStart = activePlan.startDate ? new Date(activePlan.startDate) : null
    const currentWeek = planStart
      ? Math.ceil((now.getTime() - planStart.getTime()) / (7 * 86400000))
      : null
    parts.push(
      `Plan actif : ${activePlan.name}${currentWeek !== null ? `, semaine ${currentWeek}` : ''}`
    )
  } else {
    parts.push('Aucun plan d\'entraînement actif')
  }

  if (todayWellness) {
    parts.push(
      `Wellness aujourd'hui : readiness=${todayWellness.readinessScore ?? 'N/A'}/100, fatigue=${todayWellness.fatigue ?? 'N/A'}/5`
    )
  } else {
    parts.push('Aucune donnée wellness pour aujourd\'hui')
  }

  if (loadData.length > 0) {
    const latest = loadData[loadData.length - 1]
    parts.push(
      `Charge d'entraînement : ATL=${Math.round(latest.atl)} (fatigue), CTL=${Math.round(latest.ctl)} (fitness), TSB=${latest.tsb} (forme)`
    )
  }

  return parts.join('\n')
}

export async function chatWithContext(
  userId: number,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
) {
  const client = getClient()
  if (!client) throw new Error('AI_NOT_CONFIGURED')
  const context = await buildChatContext(userId)
  const systemPrompt = `Tu es un coach triathlon personnel bienveillant et expert.\nTu connais le profil de l'athlète :\n${context}\n\nRéponds en français, de façon concise et actionnable (max 300 mots).\nAdapte tes conseils à l'état de forme actuel.`
  return client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [...history, { role: 'user', content: message }],
  })
}

export interface CompetitionAnalysis {
  evaluation: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  formAnalysis: string
}

export async function analyzeCompetition(userId: number, competitionId: number): Promise<CompetitionAnalysis> {
  const client = getClient()
  if (!client) throw new Error('AI_NOT_CONFIGURED')

  const competition = await prisma.competition.findFirst({
    where: { id: competitionId, userId },
    include: {
      planCompetitions: {
        include: {
          plan: { select: { name: true, level: true, durationWeeks: true, weeklyHours: true } },
        },
      },
    },
  })

  if (!competition) throw new Error('COMPETITION_NOT_FOUND')
  if (competition.status !== 'completed' || !competition.result) throw new Error('COMPETITION_NOT_ANALYZABLE')

  const raceDate = new Date(competition.date)
  const wellnessStart = new Date(raceDate)
  wellnessStart.setDate(wellnessStart.getDate() - 7)

  const wellnessLogs = await prisma.wellnessLog.findMany({
    where: { userId, date: { gte: wellnessStart, lte: raceDate } },
    orderBy: { date: 'asc' },
  })

  const loadData = await getTrainingLoad(userId, 90)
  const raceDateKey = raceDate.toISOString().split('T')[0]
  const raceLoad = loadData.find(d => d.date === raceDateKey)

  const distancesInfo = [
    competition.swimDistance ? `Natation: ${(competition.swimDistance / 1000).toFixed(1)}km` : null,
    competition.bikeDistance ? `Vélo: ${(competition.bikeDistance / 1000).toFixed(1)}km` : null,
    competition.runDistance ? `Course: ${(competition.runDistance / 1000).toFixed(1)}km` : null,
  ].filter(Boolean).join(', ')

  const wellnessSummary = wellnessLogs.length > 0
    ? wellnessLogs.map(w => {
        const daysBeforeRace = Math.round((raceDate.getTime() - new Date(w.date).getTime()) / 86400000)
        return `J-${daysBeforeRace}: readiness=${w.readinessScore}/100, fatigue=${w.fatigue}/5, sommeil=${w.sleepQuality}/5`
      }).join('\n')
    : 'Aucune donnée wellness disponible'

  const planInfo = competition.planCompetitions?.[0]
    ? `Plan associé: ${competition.planCompetitions[0].plan.name} (${competition.planCompetitions[0].plan.level}, ${competition.planCompetitions[0].plan.durationWeeks} semaines, ${competition.planCompetitions[0].plan.weeklyHours ?? '?'}h/sem)`
    : 'Aucun plan associé'

  const formInfo = raceLoad
    ? `CTL=${Math.round(raceLoad.ctl)} (fitness), ATL=${Math.round(raceLoad.atl)} (fatigue), TSB=${raceLoad.tsb} (forme)`
    : 'Données de charge non disponibles'

  const systemPrompt = `Tu es un coach triathlon expert. Tu analyses les résultats de compétition et fournis des retours bienveillants et concrets.

Réponds UNIQUEMENT avec du JSON valide, sans markdown :
{
  "evaluation": "string",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "formAnalysis": "string"
}`

  const userPrompt = `Analyse ce résultat :

Compétition : ${competition.name}
Type : ${competition.type} ${competition.subType}
${distancesInfo ? `Distances : ${distancesInfo}` : ''}
Objectif chrono : ${competition.chronoObjective ?? 'Non défini'}
Résultat obtenu : ${competition.result}
${competition.notes ? `Notes : ${competition.notes}` : ''}

${planInfo}

Wellness J-7 avant la course :
${wellnessSummary}

Forme le jour J : ${formInfo}

Produis : evaluation (résultat vs objectif), strengths (2-3 points forts), improvements (2-3 axes), recommendations (3 actions concrètes), formAnalysis (interprétation TSB/wellness).`

  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const message = await stream.finalMessage()
  const textBlock = message.content.find(b => b.type === 'text')
  const content = textBlock?.type === 'text' ? textBlock.text : ''
  if (!content) throw new Error('AI_EMPTY_RESPONSE')

  try {
    return JSON.parse(extractJSON(content)) as CompetitionAnalysis
  } catch {
    throw new Error('AI_INVALID_RESPONSE')
  }
}
