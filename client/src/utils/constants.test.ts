import { describe, it, expect } from 'vitest'
import {
  COMPETITION_TYPES,
  TRIATHLON_SUBTYPES,
  RUNNING_SUBTYPES,
  PRIORITIES,
  STATUSES,
  SESSION_TYPES,
  INTENSITIES,
  KNOWN_EVENTS,
  KNOWN_CITIES,
} from './constants'

describe('Constants', () => {
  describe('COMPETITION_TYPES', () => {
    it('should have triathlon and running types', () => {
      const values = COMPETITION_TYPES.map(t => t.value)
      expect(values).toContain('triathlon')
      expect(values).toContain('running')
    })

    it('should have labels for each type', () => {
      COMPETITION_TYPES.forEach(type => {
        expect(type.label).toBeDefined()
        expect(type.label.length).toBeGreaterThan(0)
      })
    })
  })

  describe('TRIATHLON_SUBTYPES', () => {
    it('should have all triathlon distances', () => {
      const values = TRIATHLON_SUBTYPES.map(t => t.value)
      expect(values).toContain('sprint')
      expect(values).toContain('olympic')
      expect(values).toContain('half-ironman')
      expect(values).toContain('ironman')
    })

    it('should have 4 triathlon subtypes', () => {
      expect(TRIATHLON_SUBTYPES).toHaveLength(4)
    })
  })

  describe('RUNNING_SUBTYPES', () => {
    it('should have common running distances', () => {
      const values = RUNNING_SUBTYPES.map(t => t.value)
      expect(values).toContain('5k')
      expect(values).toContain('10k')
      expect(values).toContain('semi-marathon')
      expect(values).toContain('marathon')
      expect(values).toContain('trail')
      expect(values).toContain('ultra')
    })
  })

  describe('PRIORITIES', () => {
    it('should have A, B, C priorities', () => {
      const values = PRIORITIES.map(p => p.value)
      expect(values).toEqual(['A', 'B', 'C'])
    })

    it('should have color classes for each priority', () => {
      PRIORITIES.forEach(priority => {
        expect(priority.color).toBeDefined()
        expect(priority.color).toContain('bg-')
        expect(priority.color).toContain('text-')
      })
    })

    it('should have A as red (highest priority)', () => {
      const priorityA = PRIORITIES.find(p => p.value === 'A')
      expect(priorityA?.color).toContain('red')
    })
  })

  describe('STATUSES', () => {
    it('should have all competition statuses', () => {
      const values = STATUSES.map(s => s.value)
      expect(values).toContain('planned')
      expect(values).toContain('registered')
      expect(values).toContain('completed')
      expect(values).toContain('dns')
      expect(values).toContain('dnf')
    })

    it('should have 5 statuses', () => {
      expect(STATUSES).toHaveLength(5)
    })
  })

  describe('SESSION_TYPES', () => {
    it('should have all training session types', () => {
      const values = SESSION_TYPES.map(t => t.value)
      expect(values).toContain('swim')
      expect(values).toContain('bike')
      expect(values).toContain('run')
      expect(values).toContain('strength')
      expect(values).toContain('rest')
      expect(values).toContain('brick')
    })

    it('should have icons for each type', () => {
      SESSION_TYPES.forEach(type => {
        expect(type.icon).toBeDefined()
        expect(type.icon.length).toBeGreaterThan(0)
      })
    })

    it('should have colors for each type', () => {
      SESSION_TYPES.forEach(type => {
        expect(type.color).toBeDefined()
        expect(type.color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })

  describe('INTENSITIES', () => {
    it('should have all intensity levels', () => {
      const values = INTENSITIES.map(i => i.value)
      expect(values).toContain('easy')
      expect(values).toContain('moderate')
      expect(values).toContain('hard')
      expect(values).toContain('interval')
      expect(values).toContain('race-pace')
    })

    it('should have color classes for each intensity', () => {
      INTENSITIES.forEach(intensity => {
        expect(intensity.color).toBeDefined()
        expect(intensity.color).toContain('bg-')
      })
    })
  })

  describe('KNOWN_EVENTS', () => {
    it('should have popular French events', () => {
      expect(KNOWN_EVENTS).toContain('Marathon de Paris')
      expect(KNOWN_EVENTS).toContain('Ironman Nice')
      expect(KNOWN_EVENTS).toContain('UTMB')
    })

    it('should have more than 20 events', () => {
      expect(KNOWN_EVENTS.length).toBeGreaterThan(20)
    })
  })

  describe('KNOWN_CITIES', () => {
    it('should have major French cities', () => {
      expect(KNOWN_CITIES).toContain('Paris')
      expect(KNOWN_CITIES).toContain('Lyon')
      expect(KNOWN_CITIES).toContain('Marseille')
      expect(KNOWN_CITIES).toContain('Nice')
    })

    it('should have more than 20 cities', () => {
      expect(KNOWN_CITIES.length).toBeGreaterThan(20)
    })

    it('should not have duplicates', () => {
      const uniqueCities = [...new Set(KNOWN_CITIES)]
      expect(uniqueCities.length).toBe(KNOWN_CITIES.length)
    })
  })
})
