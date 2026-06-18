import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportApi, downloadBlob } from './export.api'
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

describe('exportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportJSON', () => {
    it('should call GET /export/json without blob responseType', async () => {
      const mockData = {
        version: '1.0',
        exportDate: '2026-02-04',
        user: { email: 'test@test.com' },
        competitions: [],
        trainingPlans: [],
      }
      mockApi.get.mockResolvedValue({ data: mockData })

      const result = await exportApi.exportJSON()

      expect(mockApi.get).toHaveBeenCalledWith('/export/json')
      expect(result.data).toEqual(mockData)
    })

    it('should return parsed JSON data for stringify', async () => {
      const mockData = {
        version: '1.0',
        competitions: [{ name: 'Test Comp' }],
        trainingPlans: [],
      }
      mockApi.get.mockResolvedValue({ data: mockData })

      const result = await exportApi.exportJSON()

      // JSON.stringify should work correctly on parsed data
      const jsonString = JSON.stringify(result.data, null, 2)
      expect(jsonString).toContain('Test Comp')
      expect(jsonString).not.toBe('{}')
    })
  })

  describe('exportCSV', () => {
    it('should call GET /export/csv with blob responseType', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' })
      mockApi.get.mockResolvedValue({ data: mockBlob })

      await exportApi.exportCSV()

      expect(mockApi.get).toHaveBeenCalledWith('/export/csv', { responseType: 'blob' })
    })
  })

  describe('importData', () => {
    it('should call POST /export/import with data', async () => {
      const importData = {
        competitions: [{ name: 'Comp', date: '2026-06-15', type: 'triathlon', subType: 'sprint' }],
      }
      const mockResult = {
        message: 'Import termine',
        results: {
          competitions: { created: 1, errors: [] },
          trainingPlans: { created: 0, errors: [] },
          sessions: { created: 0, errors: [] },
        },
      }
      mockApi.post.mockResolvedValue({ data: mockResult })

      const result = await exportApi.importData(importData)

      expect(mockApi.post).toHaveBeenCalledWith('/export/import', importData)
      expect(result.data.results.competitions.created).toBe(1)
    })
  })
})

describe('downloadBlob', () => {
  it('should create and click a download link', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL

    const clickSpy = vi.fn()
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickSpy
      }
      return node
    })
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    const blob = new Blob(['test'], { type: 'application/json' })
    downloadBlob(blob, 'export.json')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
