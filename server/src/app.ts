import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import logger from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import prisma from './config/database.js'
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
import clubRoutes from './modules/club/club.routes.js'
import clubSessionsRoutes from './modules/club-sessions/club-sessions.routes.js'
import messagesRoutes from './modules/messages/messages.routes.js'
import groupsRoutes from './modules/groups/groups.routes.js'

const app = express()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin resources (Strava images)
}))
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
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
app.use('/api/v1/club', clubRoutes)
app.use('/api/v1/club-sessions', clubSessionsRoutes)
app.use('/api/v1/messages', messagesRoutes)
app.use('/api/v1/groups', groupsRoutes)

const startTime = Date.now()

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    // Test DB connection with a lightweight query
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000),
      db: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    })
  }
})

app.use(errorHandler)

export default app
