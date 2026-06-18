import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as statisticsController from './statistics.controller.js'

const router = Router()

router.use(authenticate)

router.get('/weekly', statisticsController.getWeeklyStats)
router.get('/distribution', statisticsController.getSportDistribution)
router.get('/overall', statisticsController.getOverallStats)
router.get('/upcoming', statisticsController.getUpcomingSessions)
router.get('/recent', statisticsController.getRecentActivity)
router.get('/training-load', statisticsController.getTrainingLoad)
router.get('/dashboard', statisticsController.getDashboard)

export default router
