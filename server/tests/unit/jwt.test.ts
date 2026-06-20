import { describe, it, expect } from 'vitest'
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt.js'

describe('JWT Utils', () => {
  const testPayload = { userId: 1, email: 'test@example.com' }

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken({ userId: 1, email: 'user1@example.com' })
      const token2 = generateAccessToken({ userId: 2, email: 'user2@example.com' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateRefreshToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should generate different token than access token', () => {
      const accessToken = generateAccessToken(testPayload)
      const refreshToken = generateRefreshToken(testPayload)

      expect(accessToken).not.toBe(refreshToken)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(testPayload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow()
    })

    it('should throw for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(testPayload)
      expect(() => verifyAccessToken(refreshToken)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(testPayload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should throw for invalid token', () => {
      expect(() => verifyRefreshToken('invalid.token.here')).toThrow()
    })

    it('should throw for access token used as refresh token', () => {
      const accessToken = generateAccessToken(testPayload)
      expect(() => verifyRefreshToken(accessToken)).toThrow()
    })
  })
})
