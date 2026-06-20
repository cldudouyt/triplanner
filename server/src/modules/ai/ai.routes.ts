import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import * as controller from './ai.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'

const generatePlanSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  targetType: z.string().min(1),
  durationWeeks: z.number().int().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyHours: z.number().int().min(2).max(25).optional(),
  startDate: z.string().optional(),
  objective: z.string().optional(),
  constraints: z.string().optional(),
})

const analyzeCompetitionSchema = z.object({
  competitionId: z.number().int().positive(),
})

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).max(20).default([]),
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Trop de requêtes IA. Réessaie dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

router.use(authMiddleware)
router.use(aiLimiter)
router.get('/status', controller.getStatus)
router.post('/generate-plan', validate(generatePlanSchema), controller.generatePlan)
router.post('/analyze-competition', validate(analyzeCompetitionSchema), controller.analyzeCompetition)
router.post('/chat', validate(chatSchema), controller.chat)

export default router
