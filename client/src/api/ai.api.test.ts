import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiApi, type GenerateAIPlanParams } from './ai.api'
import api from './client'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

describe('aiApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should call GET /ai/status', async () => {
      mockApi.get.mockResolvedValue({ data: { available: true } })

      const result = await aiApi.getStatus()

      expect(mockApi.get).toHaveBeenCalledWith('/ai/status')
      expect(result.data.available).toBe(true)
    })

    it('should return available false when AI not configured', async () => {
      mockApi.get.mockResolvedValue({ data: { available: false } })

      const result = await aiApi.getStatus()

      expect(result.data.available).toBe(false)
    })
  })

  describe('generatePlan', () => {
    it('should call POST /ai/generate-plan with params', async () => {
      const params: GenerateAIPlanParams = {
        name: 'Plan IA Marathon',
        targetType: 'marathon',
        durationWeeks: 16,
        level: 'intermediate',
        weeklyHours: 8,
        startDate: '2026-03-01',
        objective: 'Finir en moins de 4h',
        constraints: '3 jours max par semaine',
      }

      const mockPlan = {
        id: 1,
        name: 'Plan IA Marathon',
        targetType: 'marathon',
        durationWeeks: 16,
        level: 'intermediate',
        weeklyHours: 8,
        sessions: [
          { id: 1, weekNumber: 1, dayOfWeek: 1, type: 'run', title: 'Footing' },
        ],
      }
      mockApi.post.mockResolvedValue({ data: mockPlan })

      const result = await aiApi.generatePlan(params)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/generate-plan', params)
      expect(result.data.name).toBe('Plan IA Marathon')
      expect(result.data.sessions).toHaveLength(1)
    })

    it('should send minimal params', async () => {
      const params: GenerateAIPlanParams = {
        name: 'Plan simple',
        targetType: 'sprint',
        durationWeeks: 4,
        level: 'beginner',
      }

      mockApi.post.mockResolvedValue({ data: { id: 1, ...params, sessions: [] } })

      await aiApi.generatePlan(params)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/generate-plan', params)
    })
  })
})
