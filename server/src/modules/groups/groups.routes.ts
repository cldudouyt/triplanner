import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createGroupSchema, addMemberSchema } from './groups.schema.js'
import * as controller from './groups.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', controller.getGroups)
router.get('/stats', controller.getStats)
router.post('/', validate(createGroupSchema), controller.createGroup)
router.post('/:id/members', validate(addMemberSchema), controller.addGroupMember)
router.delete('/:id/members/:userId', controller.removeGroupMember)

export default router
