import type { Request, Response } from 'express'
import * as aiService from './ai.service.js'
import { getActivitiesSummaryForAI, getStravaConnection } from '../strava/strava.service.js'

export async function analyzeCompetition(req: Request, res: Response) {
  try {
    if (!aiService.isAIAvailable()) {
      res.status(503).json({ error: 'AI service not configured' })
      return
    }
    const result = await aiService.analyzeCompetition(req.user!.userId, Number(req.body.competitionId))
    res.json(result)
  } catch (err: any) {
    if (err.message === 'AI_NOT_CONFIGURED') {
      res.status(503).json({ error: 'AI service not configured' })
      return
    }
    if (err.message === 'COMPETITION_NOT_FOUND') {
      res.status(404).json({ error: 'Competition not found' })
      return
    }
    if (err.message === 'COMPETITION_NOT_ANALYZABLE') {
      res.status(400).json({ error: 'Competition must be completed with a result to analyze' })
      return
    }
    if (err.message === 'AI_EMPTY_RESPONSE' || err.message === 'AI_INVALID_RESPONSE') {
      res.status(502).json({ error: 'AI failed to analyze. Please try again.' })
      return
    }
    res.status(500).json({ error: 'Failed to analyze competition' })
  }
}

export async function chat(req: Request, res: Response) {
  if (!aiService.isAIAvailable()) {
    res.status(503).json({ error: 'AI service not configured' })
    return
  }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  try {
    const stream = await aiService.chatWithContext(req.user!.userId, req.body.message, req.body.history ?? [])
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
  } finally {
    res.end()
  }
}

export async function getStatus(_req: Request, res: Response) {
  res.json({ available: aiService.isAIAvailable() })
}

export async function generatePlan(req: Request, res: Response) {
  try {
    if (!aiService.isAIAvailable()) {
      res.status(503).json({ error: 'AI service not configured' })
      return
    }

    const userId = req.user!.userId

    // Try to enrich prompt with Strava data if user is connected
    let stravaContext: string | undefined
    try {
      const stravaConn = await getStravaConnection(userId)
      if (stravaConn) {
        const summary = await getActivitiesSummaryForAI(userId, 8)
        if (summary) stravaContext = summary
      }
    } catch {
      // Strava enrichment is optional - don't fail if it errors
    }

    const plan = await aiService.generateAIPlan(userId, { ...req.body, stravaContext })
    res.status(201).json(plan)
  } catch (err: any) {
    if (err.message === 'AI_NOT_CONFIGURED') {
      res.status(503).json({ error: 'AI service not configured' })
      return
    }
    if (err.message === 'AI_EMPTY_RESPONSE' || err.message === 'AI_INVALID_RESPONSE' || err.message === 'AI_NO_SESSIONS') {
      res.status(502).json({ error: 'AI failed to generate a valid plan. Please try again.' })
      return
    }
    res.status(500).json({ error: 'Failed to generate AI plan' })
  }
}
