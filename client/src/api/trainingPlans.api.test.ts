import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trainingPlansApi, type TrainingPlan, type PlanCompetition } from './trainingPlans.api'
import api from './client'

// Mock the api client
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

describe('trainingPlansApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should call GET /training-plans', async () => {
      const mockPlans: TrainingPlan[] = [
        {
          id: 1,
          name: 'Plan 1',
          targetType: 'sprint',
          durationWeeks: 8,
          isTemplate: false,
          sessions: [],
          competitions: [],
        },
      ]
      mockApi.get.mockResolvedValue({ data: mockPlans })

      const result = await trainingPlansApi.list()

      expect(mockApi.get).toHaveBeenCalledWith('/training-plans')
      expect(result.data).toEqual(mockPlans)
    })
  })

  describe('get', () => {
    it('should call GET /training-plans/:id', async () => {
      const mockPlan: TrainingPlan = {
        id: 1,
        name: 'Plan 1',
        targetType: 'sprint',
        durationWeeks: 8,
        isTemplate: false,
        sessions: [],
        competitions: [],
      }
      mockApi.get.mockResolvedValue({ data: mockPlan })

      const result = await trainingPlansApi.get(1)

      expect(mockApi.get).toHaveBeenCalledWith('/training-plans/1')
      expect(result.data).toEqual(mockPlan)
    })
  })

  describe('create', () => {
    it('should call POST /training-plans with data', async () => {
      const createData = {
        name: 'New Plan',
        targetType: 'marathon',
        durationWeeks: 16,
        competitionIds: [{ id: 1, isPrimary: true }],
      }
      const mockResponse: TrainingPlan = {
        id: 1,
        ...createData,
        isTemplate: false,
        sessions: [],
        competitions: [
          {
            id: 1,
            competitionId: 1,
            isPrimary: true,
            order: 0,
            competition: { id: 1, name: 'Marathon', date: '2026-04-01', type: 'running', priority: 'A' },
          },
        ],
      }
      mockApi.post.mockResolvedValue({ data: mockResponse })

      const result = await trainingPlansApi.create(createData)

      expect(mockApi.post).toHaveBeenCalledWith('/training-plans', createData)
      expect(result.data.competitions).toHaveLength(1)
    })
  })

  describe('createFromTemplate', () => {
    it('should call POST /training-plans/from-template/:id with competitionIds', async () => {
      const data = {
        competitionIds: [{ id: 1, isPrimary: true }, { id: 2 }],
        startDate: '2026-01-15',
      }
      mockApi.post.mockResolvedValue({ data: { id: 1, name: 'From Template' } })

      await trainingPlansApi.createFromTemplate(5, data)

      expect(mockApi.post).toHaveBeenCalledWith('/training-plans/from-template/5', data)
    })
  })

  describe('update', () => {
    it('should call PUT /training-plans/:id', async () => {
      const updateData = { name: 'Updated Name' }
      mockApi.put.mockResolvedValue({ data: { id: 1, name: 'Updated Name' } })

      await trainingPlansApi.update(1, updateData)

      expect(mockApi.put).toHaveBeenCalledWith('/training-plans/1', updateData)
    })
  })

  describe('delete', () => {
    it('should call DELETE /training-plans/:id', async () => {
      mockApi.delete.mockResolvedValue({})

      await trainingPlansApi.delete(1)

      expect(mockApi.delete).toHaveBeenCalledWith('/training-plans/1')
    })
  })
})

describe('PlanCompetition interface', () => {
  it('should have correct structure', () => {
    const planCompetition: PlanCompetition = {
      id: 1,
      competitionId: 2,
      isPrimary: true,
      order: 0,
      competition: {
        id: 2,
        name: 'Test Competition',
        date: '2026-06-15',
        type: 'triathlon',
        priority: 'A',
      },
    }

    expect(planCompetition.isPrimary).toBe(true)
    expect(planCompetition.competition.priority).toBe('A')
  })
})
