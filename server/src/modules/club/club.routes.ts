import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as controller from './club.controller.js'
import * as clubService from './club.service.js'
import { generateSuggestionsSchema, sendPlanSchema, respondPlanSchema } from './club.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', controller.getClubInfo)
router.get('/roster', controller.getRoster)
router.post('/ai/generate', validate(generateSuggestionsSchema), controller.generateSuggestions)
router.post('/ai/send', validate(sendPlanSchema), controller.sendPlan)
router.patch('/plan/respond', validate(respondPlanSchema), controller.respondToPlan)
router.get('/plan/:athleteId/current', controller.getAthletePlan)

router.get('/directory', async (req, res) => {
  const data = await clubService.getClubDirectory(
    req.user!.userId,
    req.query.group as string | undefined,
  )
  if (!data) return res.status(404).json({ error: 'No club' })
  res.json(data)
})

export default router
