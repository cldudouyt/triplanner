import { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import logger from '../utils/logger.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, stack: err.stack }, err.message)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err)
  }
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  })
}
