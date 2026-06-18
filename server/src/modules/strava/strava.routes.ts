import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as stravaController from './strava.controller.js'

const router = Router()

// Public callback route (no auth required - Strava redirects here)
router.get('/callback', stravaController.handleCallback)

// Protected routes
router.get('/auth-url', authenticate, stravaController.getAuthUrl)
router.get('/status', authenticate, stravaController.getStatus)
router.post('/disconnect', authenticate, stravaController.disconnect)
router.get('/activities', authenticate, stravaController.getActivities)
router.post('/sync', authenticate, stravaController.syncActivities)
router.post('/sync-competitions', authenticate, stravaController.syncCompetitions)

export default router
