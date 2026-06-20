import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as controller from './messages.controller.js'
import { createThreadSchema, sendMessageSchema } from './messages.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', controller.getThreads)
router.get('/unread-count', controller.getUnreadCount)
router.post('/', validate(createThreadSchema), controller.createThread)
router.get('/:threadId', controller.getMessages)
router.post('/:threadId', validate(sendMessageSchema), controller.sendMessage)
router.patch('/:threadId/read', controller.markAsRead)

export default router
