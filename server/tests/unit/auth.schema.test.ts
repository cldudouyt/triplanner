import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../src/modules/auth/auth.schema.js'

describe('Auth Schema Validation', () => {
  describe('registerSchema', () => {
    it('should validate a valid registration', () => {
      const input = {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Jean',
        lastName: 'Dupont',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const input = {
        email: 'not-an-email',
        password: 'password123',
        firstName: 'Jean',
        lastName: 'Dupont',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const input = {
        email: 'user@example.com',
        password: '1234567', // 7 characters
        firstName: 'Jean',
        lastName: 'Dupont',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept password with exactly 8 characters', () => {
      const input = {
        email: 'user@example.com',
        password: '12345678',
        firstName: 'Jean',
        lastName: 'Dupont',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject empty firstName', () => {
      const input = {
        email: 'user@example.com',
        password: 'password123',
        firstName: '',
        lastName: 'Dupont',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty lastName', () => {
      const input = {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Jean',
        lastName: '',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = registerSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate a valid login', () => {
      const input = {
        email: 'user@example.com',
        password: 'anypassword',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const input = {
        email: 'invalid',
        password: 'password',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const input = {
        email: 'user@example.com',
        password: '',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('should validate a valid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate a valid reset request', () => {
      const input = {
        email: 'user@example.com',
        code: '123456',
        newPassword: 'newpassword123',
      }

      const result = resetPasswordSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject short new password', () => {
      const input = {
        email: 'user@example.com',
        code: '123456',
        newPassword: '1234567',
      }

      const result = resetPasswordSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty code', () => {
      const input = {
        email: 'user@example.com',
        code: '',
        newPassword: 'newpassword123',
      }

      const result = resetPasswordSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})
