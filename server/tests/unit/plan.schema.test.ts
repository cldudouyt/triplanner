import { describe, it, expect } from 'vitest'
import { createPlanSchema, updatePlanSchema, createFromTemplateSchema } from '../../src/modules/training-plans/plan.schema.js'

describe('Plan Schema Validation', () => {
  describe('createPlanSchema', () => {
    it('should validate a valid plan with all fields', () => {
      const input = {
        name: 'Mon plan marathon',
        description: 'Préparation marathon Paris',
        targetType: 'marathon',
        durationWeeks: 12,
        competitionIds: [
          { id: 1, isPrimary: true },
          { id: 2, isPrimary: false },
        ],
        startDate: '2026-01-15',
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Mon plan marathon')
        expect(result.data.competitionIds).toHaveLength(2)
        expect(result.data.startDate).toBeInstanceOf(Date)
      }
    })

    it('should validate a minimal plan', () => {
      const input = {
        name: 'Plan simple',
        targetType: 'sprint',
        durationWeeks: 4,
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const input = {
        name: '',
        targetType: 'sprint',
        durationWeeks: 4,
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid durationWeeks', () => {
      const input = {
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 0,
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept plan without competitionIds', () => {
      const input = {
        name: 'Plan sans compétition',
        targetType: 'olympic',
        durationWeeks: 8,
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.competitionIds).toBeUndefined()
      }
    })

    it('should accept empty competitionIds array', () => {
      const input = {
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 4,
        competitionIds: [],
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept level field', () => {
      const input = {
        name: 'Plan debutant',
        targetType: 'sprint',
        durationWeeks: 8,
        level: 'beginner',
      }

      const result = createPlanSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.level).toBe('beginner')
      }
    })

    it('should accept all valid levels', () => {
      for (const level of ['beginner', 'intermediate', 'advanced']) {
        const result = createPlanSchema.safeParse({
          name: 'Plan',
          targetType: 'sprint',
          durationWeeks: 4,
          level,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid level', () => {
      const result = createPlanSchema.safeParse({
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 4,
        level: 'expert',
      })
      expect(result.success).toBe(false)
    })

    it('should accept weeklyHours field', () => {
      const result = createPlanSchema.safeParse({
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 8,
        weeklyHours: 10,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weeklyHours).toBe(10)
      }
    })

    it('should reject weeklyHours below minimum', () => {
      const result = createPlanSchema.safeParse({
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 4,
        weeklyHours: 1,
      })
      expect(result.success).toBe(false)
    })

    it('should reject weeklyHours above maximum', () => {
      const result = createPlanSchema.safeParse({
        name: 'Plan',
        targetType: 'sprint',
        durationWeeks: 4,
        weeklyHours: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should accept level and weeklyHours together', () => {
      const result = createPlanSchema.safeParse({
        name: 'Plan complet',
        targetType: 'olympic',
        durationWeeks: 12,
        level: 'intermediate',
        weeklyHours: 8,
        startDate: '2026-03-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.level).toBe('intermediate')
        expect(result.data.weeklyHours).toBe(8)
      }
    })
  })

  describe('updatePlanSchema', () => {
    it('should allow partial updates', () => {
      const input = {
        name: 'Nouveau nom',
      }

      const result = updatePlanSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updatePlanSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('createFromTemplateSchema', () => {
    it('should validate template creation with competitions', () => {
      const input = {
        competitionIds: [{ id: 1, isPrimary: true }],
        startDate: '2026-02-01',
      }

      const result = createFromTemplateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date)
      }
    })

    it('should require startDate', () => {
      const input = {
        competitionIds: [{ id: 1 }],
      }

      const result = createFromTemplateSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})
