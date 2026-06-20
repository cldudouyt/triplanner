import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as controller from './club.controller.js'
import { generateSuggestionsSchema, sendPlanSchema, respondPlanSchema } from './club.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', controller.getClubInfo)
router.get('/roster', controller.getRoster)
router.post('/ai/generate', validate(generateSuggestionsSchema), controller.generateSuggestions)
router.post('/ai/send', validate(sendPlanSchema), controller.sendPlan)
router.patch('/plan/respond', validate(respondPlanSchema), controller.respondToPlan)
router.get('/plan/:athleteId/current', controller.getAthletePlan)

export default router
