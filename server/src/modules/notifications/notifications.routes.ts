import { Router } from 'express'
import * as controller from './notifications.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { updatePreferencesSchema } from './notifications.schema.js'

const router = Router()

router.use(authMiddleware)
router.get('/preferences', controller.getPreferences)
router.patch('/preferences', validate(updatePreferencesSchema), controller.updatePreferences)

export default router
