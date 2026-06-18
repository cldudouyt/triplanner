import pino from 'pino'
import { config } from '../config/env.js'

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    env: config.nodeEnv,
  },
})

export default logger

// Create child loggers for different modules
export const authLogger = logger.child({ module: 'auth' })
export const competitionLogger = logger.child({ module: 'competition' })
export const planLogger = logger.child({ module: 'training-plan' })
export const sessionLogger = logger.child({ module: 'training-session' })
export const stravaLogger = logger.child({ module: 'strava' })
