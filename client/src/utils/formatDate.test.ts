import { describe, it, expect } from 'vitest'
import { formatDate, formatDateLong, formatInputDate } from './formatDate'

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2026-03-15')
    expect(result).toBe('15 mars 2026')
  })

  it('should format a Date object', () => {
    const result = formatDate(new Date(2026, 2, 15))
    expect(result).toBe('15 mars 2026')
  })

  it('should return "-" for invalid date', () => {
    const result = formatDate('invalid')
    expect(result).toBe('-')
  })
})

describe('formatDateLong', () => {
  it('should format a date with day name', () => {
    const result = formatDateLong('2026-03-15')
    expect(result).toContain('15')
    expect(result).toContain('mars')
    expect(result).toContain('2026')
  })

  it('should return "-" for invalid date', () => {
    const result = formatDateLong('not-a-date')
    expect(result).toBe('-')
  })
})

describe('formatInputDate', () => {
  it('should format for input[type=date]', () => {
    const result = formatInputDate('2026-03-15T10:00:00')
    expect(result).toBe('2026-03-15')
  })

  it('should return empty string for invalid date', () => {
    const result = formatInputDate('invalid')
    expect(result).toBe('')
  })
})
