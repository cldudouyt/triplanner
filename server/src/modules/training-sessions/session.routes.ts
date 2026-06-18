import { Router } from 'express'
import * as controller from './session.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createSessionSchema, updateSessionSchema } from './session.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/:id', controller.findById)
router.post('/', validate(createSessionSchema), controller.create)
router.put('/:id', validate(updateSessionSchema), controller.update)
router.delete('/:id', controller.remove)

export default router
