import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as achievementsController from './achievements.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', achievementsController.getAchievements)
router.post('/check', achievementsController.checkAchievements)
router.get('/definitions', achievementsController.getDefinitions)

export default router
