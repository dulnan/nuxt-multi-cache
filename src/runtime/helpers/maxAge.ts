const DURATIONS = {
  '1m': 60,
  '5m': 5 * 60,
  '10m': 10 * 60,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '1h': 60 * 60,
  '2h': 60 * 60 * 2,
  '4h': 60 * 60 * 4,
  '6h': 60 * 60 * 6,
  '12h': 60 * 60 * 12,
  '1d': 60 * 60 * 24,
  '2d': 60 * 60 * 24 * 2,
  '7d': 60 * 60 * 24 * 7,
} as const

export const CACHE_PERMANENT = -1
export const CACHE_NEVER = 0

type NamedExpires = keyof typeof DURATIONS
type NamedInterval = 'next-hour' | 'midnight' | 'end-of-week'

type NamedMaxAge = NamedExpires | NamedInterval

/**
 * Possible values when defining max age or other time-based values.
 *
 * - 1m - Cache for 1 minute.
 * - 5m - Cache for 5 minutes.
 * - 10m - Cache for 10 minutes.
 * - 15m - Cache for 15 minutes.
 * - 30m - Cache for 30 minutes.
 * - 1h - Cache for 1 hour.
 * - 2h - Cache for 2 hours.
 * - 4h - Cache for 4 hours.
 * - 6h - Cache for 6 hours.
 * - 12h - Cache for 12 hours.
 * - 1d - Cache for 1 day.
 * - 2d - Cache for 2 days.
 * - 7d - Cache for 7 days.
 * - permanent - Cache forever.
 * - never - Do not cache at all.
 * - next-hour - Cache until the next full hour.
 * - midnight - Cache until midnight.
 * - end-of-week - Cache until end of current week (Sunday at 23:59:59).
 */
export type MaxAge = NamedMaxAge | 'permanent' | 'never' | number

function calculateInterval(v: NamedInterval): number {
  const now = new Date()
  let target: Date

  switch (v) {
    case 'next-hour': {
      target = new Date(now)
      target.setMinutes(0, 0, 0)
      target.setHours(target.getHours() + 1)
      break
    }

    case 'midnight': {
      target = new Date(now)
      target.setHours(0, 0, 0, 0)
      target.setDate(target.getDate() + 1)
      break
    }

    case 'end-of-week': {
      target = new Date(now)
      target.setHours(23, 59, 59, 999)

      const daysUntilSunday = (7 - target.getDay()) % 7
      target.setDate(target.getDate() + daysUntilSunday)
      break
    }
  }

  // seconds until the chosen boundary.
  return Math.ceil((target.getTime() - now.getTime()) / 1000)
}

export function parseMaxAge(v: MaxAge): number {
  if (typeof v === 'number') {
    return Math.max(Math.round(v), -1)
  } else if (v === 'next-hour' || v === 'midnight' || v === 'end-of-week') {
    return calculateInterval(v)
  } else if (v === 'permanent') {
    return CACHE_PERMANENT
  } else if (v === 'never') {
    return CACHE_NEVER
  }

  const duration = DURATIONS[v]

  if (duration === undefined) {
    throw new Error('Invalid max age specificed: ' + v)
  }

  return duration
}
