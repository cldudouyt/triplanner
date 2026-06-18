import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import logger from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './modules/auth/auth.routes.js'
import competitionRoutes from './modules/competitions/competition.routes.js'
import planRoutes from './modules/training-plans/plan.routes.js'
import sessionRoutes from './modules/training-sessions/session.routes.js'
import calendarRoutes from './modules/calendar/calendar.routes.js'
import statisticsRoutes from './modules/statistics/statistics.routes.js'
import exportRoutes from './modules/export/export.routes.js'
import stravaRoutes from './modules/strava/strava.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import aiRoutes from './modules/ai/ai.routes.js'
import wellnessRoutes from './modules/wellness/wellness.routes.js'
import recordsRoutes from './modules/records/records.routes.js'
import achievementsRoutes from './modules/achievements/achievements.routes.js'
import notificationsRoutes from './modules/notifications/notifications.routes.js'
import goalsRoutes from './modules/goals/goals.routes.js'

const app = express()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(helmet())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes)
app.use('/api/v1/auth/forgot-password', passwordLimiter)
app.use('/api/v1/auth/reset-password', passwordLimiter)
app.use('/api/v1/competitions', competitionRoutes)
app.use('/api/v1/training-plans', planRoutes)
app.use('/api/v1/training-sessions', sessionRoutes)
app.use('/api/v1/calendar', calendarRoutes)
app.use('/api/v1/statistics', statisticsRoutes)
app.use('/api/v1/export', exportRoutes)
app.use('/api/v1/strava', stravaRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/ai', aiRoutes)
app.use('/api/v1/wellness', wellnessRoutes)
app.use('/api/v1/records', recordsRoutes)
app.use('/api/v1/achievements', achievementsRoutes)
app.use('/api/v1/notifications', notificationsRoutes)
app.use('/api/v1/goals', goalsRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

export default app
