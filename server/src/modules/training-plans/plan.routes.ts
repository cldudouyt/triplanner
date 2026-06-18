import { Router } from 'express'
import * as controller from './plan.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createPlanSchema, updatePlanSchema, createFromTemplateSchema } from './plan.schema.js'

const router = Router()

// Public routes (no auth needed)
router.get('/public', controller.getPublic)
router.get('/shared/:shareCode', controller.getShared)

// Protected routes
router.use(authMiddleware)
router.get('/', controller.findAll)
router.get('/templates', controller.findTemplates)
router.get('/:id', controller.findById)
router.post('/', validate(createPlanSchema), controller.create)
router.post('/from-template/:templateId', validate(createFromTemplateSchema), controller.createFromTemplate)
router.put('/:id', validate(updatePlanSchema), controller.update)
router.delete('/:id', controller.remove)
router.post('/:id/generate-sessions', controller.generateSessions)
router.post('/:id/share', controller.share)
router.delete('/:id/share', controller.revokeShare)
router.post('/:id/copy', controller.copyPublicPlan)

export default router
