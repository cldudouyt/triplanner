import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '../../src/utils/password.js'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'samePassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1')
      const hash2 = await hashPassword('password2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword'
      const hash = await hashPassword(password)

      const result = await comparePassword(password, hash)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('correctPassword')

      const result = await comparePassword('wrongPassword', hash)
      expect(result).toBe(false)
    })

    it('should handle empty password', async () => {
      const hash = await hashPassword('somePassword')

      const result = await comparePassword('', hash)
      expect(result).toBe(false)
    })

    it('should handle special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()'
      const hash = await hashPassword(password)

      const result = await comparePassword(password, hash)
      expect(result).toBe(true)
    })

    it('should handle unicode characters', async () => {
      const password = 'motdepasse_éàü_中文'
      const hash = await hashPassword(password)

      const result = await comparePassword(password, hash)
      expect(result).toBe(true)
    })
  })
})
