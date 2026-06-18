import { Request, Response } from 'express'
import * as planService from './plan.service.js'

export async function findAll(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const result = await planService.findAll(req.user!.userId, { page, limit })
  res.json(result)
}

export async function findTemplates(_req: Request, res: Response) {
  const templates = await planService.findTemplates()
  res.json(templates)
}

export async function findById(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const plan = await planService.findById(req.user!.userId, id)
  if (!plan) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.json(plan)
}

export async function create(req: Request, res: Response) {
  const plan = await planService.create(req.user!.userId, req.body)
  res.status(201).json(plan)
}

export async function createFromTemplate(req: Request, res: Response) {
  const templateId = parseInt(req.params.templateId as string)
  const { competitionIds, startDate } = req.body
  const plan = await planService.createFromTemplate(
    req.user!.userId,
    templateId,
    competitionIds,
    new Date(startDate),
  )
  if (!plan) {
    res.status(404).json({ error: 'Template non trouvé' })
    return
  }
  res.status(201).json(plan)
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const plan = await planService.update(req.user!.userId, id, req.body)
  if (!plan) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.json(plan)
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const success = await planService.remove(req.user!.userId, id)
  if (!success) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.status(204).send()
}

export async function generateSessions(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  try {
    const result = await planService.generateSessions(req.user!.userId, id)
    if (!result) {
      res.status(404).json({ error: 'Plan non trouvé' })
      return
    }
    res.json(result)
  } catch (err: any) {
    if (err.message === 'START_DATE_REQUIRED') {
      res.status(400).json({ error: 'Une date de début est requise pour générer les séances' })
      return
    }
    throw err
  }
}

export async function sharePlan(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const result = await planService.sharePlan(req.user!.userId, id)
  if (!result) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.json(result)
}

export async function unsharePlan(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const result = await planService.unsharePlan(req.user!.userId, id)
  if (!result) {
    res.status(404).json({ error: 'Plan non trouvé' })
    return
  }
  res.json(result)
}

export async function findByShareCode(req: Request, res: Response) {
  const shareCode = req.params.shareCode as string
  const plan = await planService.findByShareCode(shareCode)
  if (!plan) {
    res.status(404).json({ error: 'Plan non trouvé ou non partagé' })
    return
  }
  res.json(plan)
}

export async function copyPlan(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const plan = await planService.copyPlan(req.user!.userId, id)
  if (!plan) {
    res.status(404).json({ error: 'Plan non trouvé ou non public' })
    return
  }
  res.status(201).json(plan)
}

export async function findPublicPlans(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const result = await planService.findPublicPlans({ page, limit })
  res.json(result)
}

// ── Sharing v2 ──────────────────────────────────────────────────────────────

export async function share(req: Request, res: Response) {
  const planId = parseInt(req.params.id as string)
  try {
    const result = await planService.sharePlanV2(req.user!.userId, planId, req.body.isPublic ?? false)
    res.json(result)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PLAN_NOT_FOUND') {
      res.status(404).json({ error: 'Plan non trouvé' })
      return
    }
    throw err
  }
}

export async function revokeShare(req: Request, res: Response) {
  const planId = parseInt(req.params.id as string)
  try {
    const result = await planService.revokePlanShare(req.user!.userId, planId)
    res.json(result)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PLAN_NOT_FOUND') {
      res.status(404).json({ error: 'Plan non trouvé' })
      return
    }
    throw err
  }
}

export async function getShared(req: Request, res: Response) {
  const shareCode = req.params.shareCode as string
  try {
    const plan = await planService.getPublicPlan(shareCode)
    res.json(plan)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PLAN_NOT_FOUND') {
      res.status(404).json({ error: 'Plan non trouvé ou non partagé' })
      return
    }
    throw err
  }
}

export async function getPublic(req: Request, res: Response) {
  const targetType = req.query.targetType as string | undefined
  const level = req.query.level as string | undefined
  const result = await planService.getPublicPlans({ targetType, level })
  res.json(result)
}

export async function copyPublicPlan(req: Request, res: Response) {
  const planId = parseInt(req.params.id as string)
  try {
    const plan = await planService.copyPublicPlan(req.user!.userId, planId)
    res.status(201).json(plan)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PLAN_NOT_FOUND') {
      res.status(404).json({ error: 'Plan non trouvé ou non public' })
      return
    }
    throw err
  }
}
