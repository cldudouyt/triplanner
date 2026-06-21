import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createSessionSchema } from './club-sessions.schema.js'
import * as controller from './club-sessions.controller.js'

const router = Router()
router.use(authenticate)

router.get('/', controller.list)
router.post('/', validate(createSessionSchema), controller.create)
router.post('/:id/register', controller.register)
router.delete('/:id/register', controller.unregister)
router.get('/:id/attendees', controller.attendees)

export default router
