import { describe, expect, it } from 'vitest'
import { formatBytes, formatDirCount } from './format-bytes'

describe('formatBytes', () => {
  it('formats 1024-based binary units', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KiB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MiB')
    expect(formatBytes(1024 ** 3)).toBe('1.0 GiB')
  })

  it('returns em-dash for empty or invalid values', () => {
    expect(formatBytes(null)).toBe('—')
    expect(formatBytes(undefined)).toBe('—')
    expect(formatBytes(-1)).toBe('—')
    expect(formatBytes(Number.NaN)).toBe('—')
  })
})

describe('formatDirCount', () => {
  it('formats directory item counts and cap', () => {
    expect(formatDirCount(0)).toBe('0 项')
    expect(formatDirCount(12)).toBe('12 项')
    expect(formatDirCount(1000)).toBe('>999 项')
    expect(formatDirCount(null)).toBe('—')
  })
})
