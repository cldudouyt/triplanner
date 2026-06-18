import { describe, it, expect, vi, beforeEach } from 'vitest'
import { competitionsApi, type Competition, type CompetitionListResponse } from './competitions.api'
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

describe('competitionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should call GET /competitions without params', async () => {
      const mockResponse: CompetitionListResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }
      mockApi.get.mockResolvedValue({ data: mockResponse })

      const result = await competitionsApi.list()

      expect(mockApi.get).toHaveBeenCalledWith('/competitions', { params: undefined })
      expect(result.data.total).toBe(0)
    })

    it('should call GET /competitions with filters', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [], total: 0 } })

      await competitionsApi.list({
        type: 'triathlon',
        priority: 'A',
        page: 2,
        limit: 10,
      })

      expect(mockApi.get).toHaveBeenCalledWith('/competitions', {
        params: {
          type: 'triathlon',
          priority: 'A',
          page: 2,
          limit: 10,
        },
      })
    })

    it('should call GET /competitions with date range', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [], total: 0 } })

      await competitionsApi.list({
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        sortBy: 'date',
        sortOrder: 'desc',
      })

      expect(mockApi.get).toHaveBeenCalledWith('/competitions', {
        params: {
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
          sortBy: 'date',
          sortOrder: 'desc',
        },
      })
    })
  })

  describe('get', () => {
    it('should call GET /competitions/:id', async () => {
      const mockCompetition: Competition = {
        id: 1,
        name: 'Triathlon de Paris',
        date: '2026-06-15',
        type: 'triathlon',
        subType: 'olympic',
        priority: 'A',
        status: 'planned',
        equipmentItems: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }
      mockApi.get.mockResolvedValue({ data: mockCompetition })

      const result = await competitionsApi.get(1)

      expect(mockApi.get).toHaveBeenCalledWith('/competitions/1')
      expect(result.data.name).toBe('Triathlon de Paris')
    })
  })

  describe('create', () => {
    it('should call POST /competitions', async () => {
      const newCompetition = {
        name: 'Marathon de Paris',
        date: '2026-04-05',
        type: 'running',
        subType: 'marathon',
      }
      mockApi.post.mockResolvedValue({ data: { id: 1, ...newCompetition } })

      await competitionsApi.create(newCompetition)

      expect(mockApi.post).toHaveBeenCalledWith('/competitions', newCompetition)
    })
  })

  describe('update', () => {
    it('should call PUT /competitions/:id', async () => {
      const updates = { name: 'Updated Name', priority: 'A' }
      mockApi.put.mockResolvedValue({ data: { id: 1, ...updates } })

      await competitionsApi.update(1, updates)

      expect(mockApi.put).toHaveBeenCalledWith('/competitions/1', updates)
    })
  })

  describe('delete', () => {
    it('should call DELETE /competitions/:id', async () => {
      mockApi.delete.mockResolvedValue({})

      await competitionsApi.delete(1)

      expect(mockApi.delete).toHaveBeenCalledWith('/competitions/1')
    })
  })

  describe('equipment', () => {
    it('should add equipment item', async () => {
      const equipmentData = { name: 'Combinaison', category: 'Natation' }
      mockApi.post.mockResolvedValue({ data: { id: 1, ...equipmentData, checked: false } })

      await competitionsApi.addEquipment(5, equipmentData)

      expect(mockApi.post).toHaveBeenCalledWith('/competitions/5/equipment', equipmentData)
    })

    it('should update equipment item', async () => {
      mockApi.put.mockResolvedValue({ data: { id: 1, checked: true } })

      await competitionsApi.updateEquipment(5, 1, { checked: true })

      expect(mockApi.put).toHaveBeenCalledWith('/competitions/5/equipment/1', { checked: true })
    })

    it('should remove equipment item', async () => {
      mockApi.delete.mockResolvedValue({})

      await competitionsApi.removeEquipment(5, 1)

      expect(mockApi.delete).toHaveBeenCalledWith('/competitions/5/equipment/1')
    })
  })

  describe('suggestions', () => {
    it('should call GET /competitions/suggestions', async () => {
      const mockSuggestions = {
        names: ['Marathon de Paris', 'Ironman Nice'],
        locations: ['Paris', 'Nice'],
      }
      mockApi.get.mockResolvedValue({ data: mockSuggestions })

      const result = await competitionsApi.suggestions()

      expect(mockApi.get).toHaveBeenCalledWith('/competitions/suggestions')
      expect(result.data.names).toHaveLength(2)
    })
  })

  describe('import', () => {
    it('should call POST /competitions/import with FormData', async () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' })
      mockApi.post.mockResolvedValue({ data: { imported: 5 } })

      await competitionsApi.import(file)

      expect(mockApi.post).toHaveBeenCalledWith(
        '/competitions/import',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    })
  })
})
