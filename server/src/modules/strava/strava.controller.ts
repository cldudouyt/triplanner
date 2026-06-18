import { Request, Response } from 'express'
import * as stravaService from './strava.service.js'
import { config } from '../../config/env.js'
import crypto from 'node:crypto'

// Store state tokens temporarily (in production, use Redis or database)
const stateTokens = new Map<string, { userId: number; expires: number }>()

export async function getAuthUrl(req: Request, res: Response) {
  if (!config.strava.clientId) {
    res.status(501).json({ error: 'Strava integration not configured' })
    return
  }

  const state = crypto.randomBytes(16).toString('hex')
  stateTokens.set(state, {
    userId: req.user!.userId,
    expires: Date.now() + 10 * 60 * 1000,
  })

  const url = stravaService.getAuthorizationUrl(state)
  res.json({ url })
}

export async function handleCallback(req: Request, res: Response) {
  const { code, state, error } = req.query

  if (error) {
    res.redirect(`${config.appUrl}/settings?strava_error=${error}`)
    return
  }

  if (!state || !code) {
    res.redirect(`${config.appUrl}/settings?strava_error=missing_params`)
    return
  }

  const stateData = stateTokens.get(state as string)
  if (!stateData || stateData.expires < Date.now()) {
    res.redirect(`${config.appUrl}/settings?strava_error=invalid_state`)
    return
  }

  stateTokens.delete(state as string)

  try {
    const tokenData = await stravaService.exchangeCodeForToken(code as string)
    await stravaService.saveStravaConnection(stateData.userId, tokenData)
    res.redirect(`${config.appUrl}/settings?strava_connected=true`)
  } catch {
    res.redirect(`${config.appUrl}/settings?strava_error=auth_failed`)
  }
}

export async function getStatus(req: Request, res: Response) {
  const connection = await stravaService.getStravaConnection(req.user!.userId)

  if (!connection) {
    res.json({ connected: false })
    return
  }

  try {
    const athlete = await stravaService.getAthleteProfile(req.user!.userId)
    res.json({
      connected: true,
      athlete: {
        id: athlete.id,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
      },
    })
  } catch {
    res.json({ connected: true, athlete: null })
  }
}

export async function disconnect(req: Request, res: Response) {
  await stravaService.disconnectStrava(req.user!.userId)
  res.json({ message: 'Strava disconnected' })
}

export async function getActivities(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const activities = await stravaService.getActivities(req.user!.userId, page)
    res.json(activities)
  } catch (err: any) {
    if (err.message === 'STRAVA_NOT_CONNECTED') {
      res.status(400).json({ error: 'Strava not connected' })
      return
    }
    throw err
  }
}

export async function syncActivities(req: Request, res: Response) {
  try {
    const result = await stravaService.syncActivitiesWithSessions(req.user!.userId)
    res.json(result)
  } catch (err: any) {
    if (err.message === 'STRAVA_NOT_CONNECTED') {
      res.status(400).json({ error: 'Strava not connected' })
      return
    }
    throw err
  }
}

export async function syncCompetitions(req: Request, res: Response) {
  try {
    const result = await stravaService.syncActivitiesWithCompetitions(req.user!.userId)
    res.json(result)
  } catch (err: any) {
    if (err.message === 'STRAVA_NOT_CONNECTED') {
      res.status(400).json({ error: 'Strava not connected' })
      return
    }
    throw err
  }
}
