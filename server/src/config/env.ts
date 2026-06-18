import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
  // Email configuration
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@triathlon-planner.local',
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  // Anthropic AI (Claude) configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  // Strava integration
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || '',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
    redirectUri: process.env.STRAVA_REDIRECT_URI || 'http://localhost:3001/api/v1/strava/callback',
  },
}
