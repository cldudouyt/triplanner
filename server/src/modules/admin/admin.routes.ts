import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { adminMiddleware } from '../../middleware/admin.js'
import * as adminController from './admin.controller.js'

const router = Router()

// All admin routes require authentication and admin role
router.use(authMiddleware)
router.use(adminMiddleware)

// Dashboard
router.get('/dashboard', adminController.getDashboard)

// Users management
router.get('/users', adminController.listUsers)
router.get('/users/:id', adminController.getUser)
router.put('/users/:id', adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// Content management
router.get('/content', adminController.listContent)
router.delete('/content/:type/:id', adminController.deleteContent)

// System logs
router.get('/logs', adminController.getSystemLogs)

export default router
