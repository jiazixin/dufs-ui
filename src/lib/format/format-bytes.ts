const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }
  if (bytes === 0) {
    return '0 B'
  }
  const index = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const unit = UNITS[index] ?? 'TiB'
  const value = bytes / 1024 ** index
  if (index === 0) {
    return `${String(Math.round(value))} ${unit}`
  }
  return `${value.toFixed(1)} ${unit}`
}

export function formatDirCount(count: number | null | undefined, maxCount = 1000): string {
  if (count === null || count === undefined || !Number.isFinite(count) || count < 0) {
    return '—'
  }
  if (count >= maxCount) {
    return `>${String(maxCount - 1)} 项`
  }
  return `${String(count)} 项`
}
