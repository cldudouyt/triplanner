import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createWellnessLogSchema } from './wellness.schema.js'
import * as wellnessController from './wellness.controller.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(createWellnessLogSchema), wellnessController.createLog)
router.get('/', wellnessController.getLogs)
router.get('/today', wellnessController.getToday)
router.get('/trend', wellnessController.getTrend)
router.get('/alerts', wellnessController.getAlerts)
router.delete('/:id', wellnessController.deleteLog)

export default router
