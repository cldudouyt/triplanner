import { Router } from 'express'
import * as controller from './goals.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createGoalSchema } from './goals.schema.js'

const router = Router()
router.use(authMiddleware)
router.get('/', controller.listGoals)
router.post('/', validate(createGoalSchema), controller.createGoal)
router.delete('/:id', controller.deleteGoal)
export default router
