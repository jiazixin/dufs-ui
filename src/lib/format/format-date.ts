function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0) {
    return '—'
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  const y = String(date.getFullYear())
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  return `${y}-${m}-${d} ${hh}:${mm}`
}

export function formatShortDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0) {
    return '—'
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return '—'
  }
  const total = Math.ceil(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  }
  return `${pad2(m)}:${pad2(s)}`
}
