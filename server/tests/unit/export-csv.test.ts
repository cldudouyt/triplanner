import { describe, it, expect } from 'vitest'
import { exportToCSV } from '../../src/modules/export/export.service.js'

function makeExportData(overrides?: {
  competitions?: any[]
  trainingPlans?: any[]
}) {
  return {
    exportDate: '2026-02-04T10:00:00.000Z',
    version: '1.0',
    user: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date('2025-01-01'),
    },
    competitions: overrides?.competitions ?? [],
    trainingPlans: overrides?.trainingPlans ?? [],
  }
}

describe('exportToCSV', () => {
  it('should generate CSV with headers when no data', () => {
    const csv = exportToCSV(makeExportData())

    expect(csv).toContain('# COMPETITIONS')
    expect(csv).toContain('Nom,Date,Lieu')
    expect(csv).toContain('# TRAINING SESSIONS')
    expect(csv).toContain('Plan,Semaine,Jour')
  })

  it('should include competition data', () => {
    const csv = exportToCSV(makeExportData({
      competitions: [{
        name: 'Triathlon de Paris',
        date: '2026-06-15T00:00:00.000Z',
        location: 'Paris',
        type: 'triathlon',
        subType: 'olympic',
        swimDistance: 1500,
        bikeDistance: 40000,
        runDistance: 10000,
        chronoObjective: '2:30:00',
        result: null,
        registrationLink: null,
        notes: null,
        priority: 'A',
        budget: null,
        accommodation: null,
        transport: null,
        status: 'registered',
        equipmentItems: [],
      }],
    }))

    expect(csv).toContain('Triathlon de Paris')
    expect(csv).toContain('2026-06-15')
    expect(csv).toContain('Paris')
    expect(csv).toContain('triathlon')
    expect(csv).toContain('olympic')
    expect(csv).toContain('1500')
    expect(csv).toContain('40000')
    expect(csv).toContain('2:30:00')
  })

  it('should escape CSV values with commas', () => {
    const csv = exportToCSV(makeExportData({
      competitions: [{
        name: 'Triathlon de Paris, France',
        date: '2026-06-15T00:00:00.000Z',
        location: 'Paris, Ile-de-France',
        type: 'triathlon',
        subType: 'olympic',
        swimDistance: null,
        bikeDistance: null,
        runDistance: null,
        chronoObjective: null,
        result: null,
        registrationLink: null,
        notes: null,
        priority: 'B',
        budget: null,
        accommodation: null,
        transport: null,
        status: 'planned',
        equipmentItems: [],
      }],
    }))

    expect(csv).toContain('"Triathlon de Paris, France"')
    expect(csv).toContain('"Paris, Ile-de-France"')
  })

  it('should escape CSV values with quotes', () => {
    const csv = exportToCSV(makeExportData({
      competitions: [{
        name: 'Le "Grand" Triathlon',
        date: '2026-06-15T00:00:00.000Z',
        location: null,
        type: 'triathlon',
        subType: 'sprint',
        swimDistance: null,
        bikeDistance: null,
        runDistance: null,
        chronoObjective: null,
        result: null,
        registrationLink: null,
        notes: null,
        priority: 'B',
        budget: null,
        accommodation: null,
        transport: null,
        status: 'planned',
        equipmentItems: [],
      }],
    }))

    expect(csv).toContain('"Le ""Grand"" Triathlon"')
  })

  it('should include training sessions', () => {
    const csv = exportToCSV(makeExportData({
      trainingPlans: [{
        name: 'Plan Marathon',
        description: 'Preparation marathon',
        targetType: 'marathon',
        level: 'intermediate',
        weeklyHours: 8,
        durationWeeks: 12,
        startDate: '2026-01-06T00:00:00.000Z',
        endDate: null,
        linkedCompetitions: [],
        sessions: [{
          weekNumber: 1,
          dayOfWeek: 2,
          date: '2026-01-07T00:00:00.000Z',
          type: 'run',
          title: 'Footing facile',
          description: 'Course lente',
          duration: 30,
          distance: 5,
          intensity: 'easy',
          completed: false,
          actualDuration: null,
          actualDistance: null,
          notes: null,
        }],
      }],
    }))

    expect(csv).toContain('Plan Marathon')
    expect(csv).toContain('Footing facile')
    expect(csv).toContain('2026-01-07')
    expect(csv).toContain('Non') // completed = false
  })

  it('should show Oui for completed sessions', () => {
    const csv = exportToCSV(makeExportData({
      trainingPlans: [{
        name: 'Plan',
        description: null,
        targetType: 'sprint',
        level: null,
        weeklyHours: null,
        durationWeeks: 4,
        startDate: null,
        endDate: null,
        linkedCompetitions: [],
        sessions: [{
          weekNumber: 1,
          dayOfWeek: 1,
          date: null,
          type: 'run',
          title: 'Run done',
          description: null,
          duration: 45,
          distance: 8,
          intensity: 'moderate',
          completed: true,
          actualDuration: 47,
          actualDistance: 8.2,
          notes: 'Bonne seance',
        }],
      }],
    }))

    expect(csv).toContain('Oui') // completed = true
    expect(csv).toContain('47')
    expect(csv).toContain('8.2')
    expect(csv).toContain('Bonne seance')
  })

  it('should handle null values gracefully', () => {
    const csv = exportToCSV(makeExportData({
      competitions: [{
        name: 'Test',
        date: '2026-06-15T00:00:00.000Z',
        location: null,
        type: 'running',
        subType: '10k',
        swimDistance: null,
        bikeDistance: null,
        runDistance: 10000,
        chronoObjective: null,
        result: null,
        registrationLink: null,
        notes: null,
        priority: 'C',
        budget: null,
        accommodation: null,
        transport: null,
        status: 'planned',
        equipmentItems: [],
      }],
    }))

    // Should not contain "null" string
    expect(csv).not.toContain('null')
  })

  it('should handle multiple competitions and plans', () => {
    const csv = exportToCSV(makeExportData({
      competitions: [
        {
          name: 'Comp 1', date: '2026-03-01T00:00:00.000Z', location: 'Paris',
          type: 'triathlon', subType: 'sprint', swimDistance: null, bikeDistance: null,
          runDistance: null, chronoObjective: null, result: null, registrationLink: null,
          notes: null, priority: 'A', budget: null, accommodation: null, transport: null,
          status: 'planned', equipmentItems: [],
        },
        {
          name: 'Comp 2', date: '2026-06-01T00:00:00.000Z', location: 'Lyon',
          type: 'running', subType: 'marathon', swimDistance: null, bikeDistance: null,
          runDistance: 42195, chronoObjective: null, result: null, registrationLink: null,
          notes: null, priority: 'B', budget: null, accommodation: null, transport: null,
          status: 'registered', equipmentItems: [],
        },
      ],
      trainingPlans: [
        {
          name: 'Plan 1', description: null, targetType: 'sprint', level: 'beginner',
          weeklyHours: 6, durationWeeks: 8, startDate: null, endDate: null,
          linkedCompetitions: [], sessions: [],
        },
        {
          name: 'Plan 2', description: null, targetType: 'marathon', level: 'advanced',
          weeklyHours: 15, durationWeeks: 16, startDate: null, endDate: null,
          linkedCompetitions: [], sessions: [],
        },
      ],
    }))

    expect(csv).toContain('Comp 1')
    expect(csv).toContain('Comp 2')
  })
})
