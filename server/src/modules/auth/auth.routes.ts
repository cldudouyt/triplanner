import { Router } from 'express'
import * as authController from './auth.controller.js'
import { validate } from '../../middleware/validate.js'
import { authMiddleware } from '../../middleware/auth.js'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, onboardingSchema } from './auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)

router.patch('/onboarding', authMiddleware, validate(onboardingSchema), authController.completeOnboarding)

export default router
