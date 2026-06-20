import { describe, it, expect } from 'vitest'
import { createCompetitionSchema, updateCompetitionSchema, competitionQuerySchema } from '../../src/modules/competitions/competition.schema.js'

describe('Competition Schema Validation', () => {
  describe('createCompetitionSchema', () => {
    it('should validate a minimal triathlon competition', () => {
      const input = {
        name: 'Triathlon de Paris',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'olympic',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date)
        expect(result.data.priority).toBe('B') // default
        expect(result.data.status).toBe('planned') // default
      }
    })

    it('should validate a full competition with all fields', () => {
      const input = {
        name: 'Ironman Nice',
        date: '2026-09-20',
        location: 'Nice, France',
        type: 'triathlon',
        subType: 'ironman',
        swimDistance: 3800,
        bikeDistance: 180000,
        runDistance: 42195,
        chronoObjective: '12:00:00',
        registrationLink: 'https://ironman.com/nice',
        notes: 'Objectif principal de la saison',
        priority: 'A',
        budget: 500,
        accommodation: 'Hotel Negresco',
        transport: 'Train',
        status: 'registered',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('A')
        expect(result.data.swimDistance).toBe(3800)
      }
    })

    it('should validate a running competition', () => {
      const input = {
        name: 'Marathon de Paris',
        date: '2026-04-05',
        type: 'running',
        subType: 'marathon',
        runDistance: 42195,
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const input = {
        name: '',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'sprint',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid type', () => {
      const input = {
        name: 'Test',
        date: '2026-06-15',
        type: 'swimming', // invalid
        subType: 'sprint',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid priority', () => {
      const input = {
        name: 'Test',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'sprint',
        priority: 'D', // invalid
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const input = {
        name: 'Test',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'sprint',
        status: 'cancelled', // invalid
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept empty registration link', () => {
      const input = {
        name: 'Test',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'sprint',
        registrationLink: '',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL for registration link', () => {
      const input = {
        name: 'Test',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'sprint',
        registrationLink: 'not-a-url',
      }

      const result = createCompetitionSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('updateCompetitionSchema', () => {
    it('should allow partial updates', () => {
      const result = updateCompetitionSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateCompetitionSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate priority change', () => {
      const result = updateCompetitionSchema.safeParse({ priority: 'A' })
      expect(result.success).toBe(true)
    })

    it('should validate status change', () => {
      const result = updateCompetitionSchema.safeParse({ status: 'completed' })
      expect(result.success).toBe(true)
    })

    it('should accept null values for optional fields', () => {
      const result = updateCompetitionSchema.safeParse({
        location: null,
        chronoObjective: null,
        result: null,
        notes: null,
        budget: null,
        accommodation: null,
        transport: null,
        swimDistance: null,
        bikeDistance: null,
        runDistance: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept mix of null and defined values', () => {
      const result = updateCompetitionSchema.safeParse({
        name: 'Updated',
        location: null,
        priority: 'A',
        notes: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('competitionQuerySchema', () => {
    it('should provide defaults for pagination', () => {
      const result = competitionQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('date')
        expect(result.data.sortOrder).toBe('asc')
      }
    })

    it('should parse numeric strings for pagination', () => {
      const result = competitionQuerySchema.safeParse({ page: '3', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should accept filter parameters', () => {
      const input = {
        type: 'triathlon',
        subType: 'sprint',
        status: 'planned',
        priority: 'A',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      }

      const result = competitionQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept sort parameters', () => {
      const result = competitionQuerySchema.safeParse({
        sortBy: 'name',
        sortOrder: 'desc',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortOrder).toBe('desc')
      }
    })
  })
})
