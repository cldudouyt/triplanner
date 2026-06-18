import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { geocodeLocations } from './geocode'

describe('geocodeLocations', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  it('should return coordinates for valid locations', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ lat: '48.8566', lon: '2.3522' }]),
    })

    const result = await geocodeLocations(['Paris'])

    expect(result.has('Paris')).toBe(true)
    const coords = result.get('Paris')!
    expect(coords[0]).toBeCloseTo(48.8566)
    expect(coords[1]).toBeCloseTo(2.3522)
  })

  it('should handle empty response from nominatim', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
    })

    const result = await geocodeLocations(['NonExistentPlace12345'])

    expect(result.has('NonExistentPlace12345')).toBe(false)
  })

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await geocodeLocations(['Paris'])

    // Should not throw, just return without the failed location
    expect(result).toBeInstanceOf(Map)
  })

  it('should deduplicate locations', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ lat: '45.764', lon: '4.8357' }]),
    })

    // Use a unique location name not used in other tests to avoid cache hits
    await geocodeLocations(['Lyon-Dedup', 'Lyon-Dedup', 'Lyon-Dedup'])

    // Should only call fetch once for deduplicated location
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should use cache for previously geocoded locations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ lat: '47.2184', lon: '-1.5536' }]),
    })
    global.fetch = fetchMock

    // First call
    await geocodeLocations(['Nantes'])
    const callCount = fetchMock.mock.calls.length

    // Second call with same location - should use cache
    await geocodeLocations(['Nantes'])

    expect(fetchMock.mock.calls.length).toBe(callCount)
  })

  it('should call nominatim with correct URL format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{ lat: '48.0', lon: '2.0' }]),
    })

    await geocodeLocations(['Saint-Malo'])

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.objectContaining({
        headers: { 'User-Agent': 'triathlon-app' },
      })
    )

    const callUrl = (global.fetch as any).mock.calls[0][0] as string
    expect(callUrl).toContain(encodeURIComponent('Saint-Malo'))
    expect(callUrl).toContain('France')
  })

  it('should handle multiple locations', async () => {
    let callIndex = 0
    const responses = [
      [{ lat: '48.8566', lon: '2.3522' }],
      [{ lat: '43.2965', lon: '5.3698' }],
    ]

    global.fetch = vi.fn().mockImplementation(() => {
      const data = responses[callIndex] || []
      callIndex++
      return Promise.resolve({ json: () => Promise.resolve(data) })
    })

    const result = await geocodeLocations(['Paris', 'Marseille'])

    expect(result.has('Paris')).toBe(true)
    expect(result.has('Marseille')).toBe(true)
  })
})
