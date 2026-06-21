import * as Sentry from '@sentry/node'
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 })
}

import { createServer } from 'http'
import app from './app.js'
import { config } from './config/env.js'
import logger from './utils/logger.js'
import './cron.js'
import { createMessagesWss } from './modules/messages/messages.ws.js'

const server = createServer(app)
createMessagesWss(server)

server.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server running')
})
