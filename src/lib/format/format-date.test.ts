import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDuration, formatShortDate } from './format-date'

describe('format-date', () => {
  it('formats timestamps consistently', () => {
    const ms = new Date(2026, 4, 9, 8, 5).getTime()
    expect(formatDateTime(ms)).toBe('2026-05-09 08:05')
    expect(formatShortDate(ms)).toBe('05-09')
  })

  it('returns em-dash for invalid timestamps', () => {
    expect(formatDateTime(0)).toBe('—')
    expect(formatDateTime(null)).toBe('—')
    expect(formatShortDate(undefined)).toBe('—')
  })

  it('formats remaining upload durations', () => {
    expect(formatDuration(5)).toBe('00:05')
    expect(formatDuration(125)).toBe('02:05')
    expect(formatDuration(3661)).toBe('01:01:01')
    expect(formatDuration(Infinity)).toBe('—')
  })
})
