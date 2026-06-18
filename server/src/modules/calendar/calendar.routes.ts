import { Router } from 'express'
import * as controller from './calendar.controller.js'
import { authMiddleware } from '../../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.get('/events', controller.getEvents)

export default router
