import { Request, Response } from 'express'
import * as clubService from './club.service.js'

export async function getClubInfo(req: Request, res: Response) {
  const result = await clubService.getClubInfo(req.user!.userId)
  // Retourne null si pas de club — le frontend affiche un état vide
  res.json(result ?? { club: null, role: null, stats: { athletesCount: 0, activePlans: 0, weekCompletionPct: 0, weekCompletedSessions: 0, weekPlannedSessions: 0 } })
}

export async function getRoster(req: Request, res: Response) {
  const result = await clubService.getRoster(req.user!.userId)
  // Retourne tableau vide si pas coach — pas d'erreur 403
  res.json(result ?? [])
}

export async function generateSuggestions(req: Request, res: Response) {
  const { athleteId, planId, weekNumber } = req.body as {
    athleteId: number
    planId: number
    weekNumber: number
  }
  const result = await clubService.generateSuggestions(req.user!.userId, athleteId, planId, weekNumber)
  if (!result) {
    res.status(403).json({ error: 'Accès non autorisé ou athlète non trouvé' })
    return
  }
  res.status(201).json(result)
}

export async function sendPlan(req: Request, res: Response) {
  const { suggestionId, appliedIds, coachNote } = req.body as {
    suggestionId: number
    appliedIds: string[]
    coachNote?: string
  }
  const result = await clubService.sendPlan(req.user!.userId, suggestionId, appliedIds, coachNote)
  if (!result) {
    res.status(404).json({ error: 'Suggestion non trouvée' })
    return
  }
  res.json(result)
}

export async function respondToPlan(req: Request, res: Response) {
  const { suggestionId, action } = req.body as {
    suggestionId: number
    action: 'accept' | 'reject'
  }
  const result = await clubService.respondToPlan(req.user!.userId, suggestionId, action)
  if (!result) {
    res.status(404).json({ error: 'Suggestion non trouvée' })
    return
  }
  res.json(result)
}

export async function getAthletePlan(req: Request, res: Response) {
  const athleteId = parseInt(req.params.athleteId as string)
  if (isNaN(athleteId)) {
    res.status(400).json({ error: 'athleteId invalide' })
    return
  }
  const result = await clubService.getAthletePlan(athleteId)
  res.json(result)
}
