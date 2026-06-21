import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { adminMiddleware } from '../../middleware/admin.js'
import { validate } from '../../middleware/validate.js'
import { updateUserSchema } from './admin.schema.js'
import * as adminController from './admin.controller.js'
import * as service from './admin.service.js'

const router = Router()

// All admin routes require authentication and admin role
router.use(authMiddleware)
router.use(adminMiddleware)

// Dashboard
router.get('/dashboard', adminController.getDashboard)

// Users management
router.get('/users', adminController.listUsers)
router.get('/users/:id', adminController.getUser)
router.put('/users/:id', validate(updateUserSchema), adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// Content management
router.get('/content', adminController.listContent)
router.delete('/content/:type/:id', adminController.deleteContent)

// System logs
router.get('/logs', adminController.getSystemLogs)

// ─── Club CODIR Admin ──────────────────────────────────────────────────────────

// Stats
router.get('/club-stats', async (req, res) => {
  const stats = await service.getClubStats(req.user!.userId)
  res.json(stats)
})

// Membres
router.get('/members', async (req, res) => {
  const members = await service.getMembers(req.user!.userId, req.query.filter as string)
  res.json(members)
})

router.patch('/members/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['athlete', 'coach', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  const result = await service.updateMemberRole(req.user!.userId, parseInt(req.params.id as string), role)
  res.json(result)
})

// Invitations
router.get('/invitations', async (req, res) => {
  const list = await service.listInvitations(req.user!.userId)
  res.json(list)
})

router.post('/invitations', async (req, res) => {
  const inv = await service.createInvitation(req.user!.userId, req.body)
  res.status(201).json(inv)
})

router.post('/invitations/:id/resend', async (req, res) => {
  const inv = await service.resendInvitation(req.user!.userId, parseInt(req.params.id as string))
  res.json(inv)
})

router.delete('/invitations/:id', async (req, res) => {
  await service.deleteInvitation(req.user!.userId, parseInt(req.params.id as string))
  res.status(204).send()
})

export default router
