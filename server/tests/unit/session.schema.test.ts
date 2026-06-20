import { describe, it, expect } from 'vitest'
import { createSessionSchema, updateSessionSchema } from '../../src/modules/training-sessions/session.schema.js'

describe('Session Schema Validation', () => {
  describe('createSessionSchema', () => {
    it('should validate a minimal session', () => {
      const input = {
        planId: 1,
        weekNumber: 1,
        dayOfWeek: 1,
        type: 'run',
      }

      const result = createSessionSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate a complete session', () => {
      const input = {
        planId: 1,
        weekNumber: 3,
        dayOfWeek: 5,
        date: '2026-02-15',
        type: 'swim',
        title: 'Séance technique',
        description: 'Focus sur la respiration bilatérale',
        duration: 60,
        distance: 2500,
        intensity: 'moderate',
      }

      const result = createSessionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date)
      }
    })

    it('should validate all session types', () => {
      const types = ['swim', 'bike', 'run', 'strength', 'rest', 'brick']

      for (const type of types) {
        const result = createSessionSchema.safeParse({
          planId: 1,
          weekNumber: 1,
          dayOfWeek: 1,
          type,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should validate all intensities', () => {
      const intensities = ['easy', 'moderate', 'hard', 'interval', 'race-pace']

      for (const intensity of intensities) {
        const result = createSessionSchema.safeParse({
          planId: 1,
          weekNumber: 1,
          dayOfWeek: 1,
          type: 'run',
          intensity,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid session type', () => {
      const result = createSessionSchema.safeParse({
        planId: 1,
        weekNumber: 1,
        dayOfWeek: 1,
        type: 'yoga', // invalid
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid intensity', () => {
      const result = createSessionSchema.safeParse({
        planId: 1,
        weekNumber: 1,
        dayOfWeek: 1,
        type: 'run',
        intensity: 'extreme', // invalid
      })
      expect(result.success).toBe(false)
    })

    it('should reject weekNumber < 1', () => {
      const result = createSessionSchema.safeParse({
        planId: 1,
        weekNumber: 0,
        dayOfWeek: 1,
        type: 'run',
      })
      expect(result.success).toBe(false)
    })

    it('should reject dayOfWeek < 1', () => {
      const result = createSessionSchema.safeParse({
        planId: 1,
        weekNumber: 1,
        dayOfWeek: 0,
        type: 'run',
      })
      expect(result.success).toBe(false)
    })

    it('should reject dayOfWeek > 7', () => {
      const result = createSessionSchema.safeParse({
        planId: 1,
        weekNumber: 1,
        dayOfWeek: 8,
        type: 'run',
      })
      expect(result.success).toBe(false)
    })

    it('should accept dayOfWeek 1-7', () => {
      for (let day = 1; day <= 7; day++) {
        const result = createSessionSchema.safeParse({
          planId: 1,
          weekNumber: 1,
          dayOfWeek: day,
          type: 'run',
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('updateSessionSchema', () => {
    it('should allow partial updates', () => {
      const result = updateSessionSchema.safeParse({ title: 'Nouveau titre' })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateSessionSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate completed flag', () => {
      const result = updateSessionSchema.safeParse({ completed: true })
      expect(result.success).toBe(true)
    })

    it('should validate actual metrics', () => {
      const result = updateSessionSchema.safeParse({
        completed: true,
        actualDuration: 65,
        actualDistance: 10500,
        notes: 'Bonne séance, ressenti positif',
      })
      expect(result.success).toBe(true)
    })

    it('should validate type change', () => {
      const result = updateSessionSchema.safeParse({ type: 'bike' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const result = updateSessionSchema.safeParse({ type: 'invalid' })
      expect(result.success).toBe(false)
    })
  })
})
