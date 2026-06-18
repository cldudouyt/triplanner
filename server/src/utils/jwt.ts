import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

interface TokenPayload {
  userId: number
  email: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiry as jwt.SignOptions['expiresIn'],
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiry as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.accessTokenSecret) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.refreshTokenSecret) as TokenPayload
}
