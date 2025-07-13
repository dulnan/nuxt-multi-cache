const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const DURATIONS = {
  '1m': MINUTE,
  '5m': 5 * MINUTE,
  '10m': 10 * MINUTE,
  '15m': 15 * MINUTE,
  '30m': 30 * MINUTE,
  '1h': HOUR,
  '2h': 2 * HOUR,
  '4h': 4 * HOUR,
  '6h': 6 * HOUR,
  '12h': 12 * HOUR,
  '1d': DAY,
  '2d': 2 * DAY,
  '7d': 7 * DAY,
  '30d': 30 * DAY,
} as const

export const CACHE_PERMANENT = -1
export const CACHE_NEVER = 0

type NamedDurations = keyof typeof DURATIONS
type NamedInterval =
  | 'next-hour'
  | 'midnight'
  | 'end-of-week'
  | 'next-quarter-hour'

type NamedMaxAge = NamedDurations | NamedInterval

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
 * - next-quarter-hour - Cache until the next x.15 hour (08:00, 08:15, 08:30, etc.).
 * - next-hour - Cache until the next full hour.
 * - midnight - Cache until midnight.
 * - end-of-week - Cache until end of current week (Sunday at 23:59:59).
 */
export type MaxAge = NamedMaxAge | 'permanent' | 'never' | number

function calculateInterval(v: NamedInterval, providedNow: number): number {
  const nowMilliseconds = providedNow * 1000
  const target = new Date(nowMilliseconds)

  switch (v) {
    case 'next-hour': {
      target.setMinutes(0, 0, 0)
      target.setHours(target.getHours() + 1)
      break
    }

    case 'next-quarter-hour': {
      target.setSeconds(0, 0)
      const minutes = target.getMinutes()
      const increment = 15 - (minutes % 15)
      target.setMinutes(minutes + increment)
      break
    }

    case 'midnight': {
      target.setHours(0, 0, 0, 0)
      target.setDate(target.getDate() + 1)
      break
    }

    case 'end-of-week': {
      target.setHours(23, 59, 59, 999)

      const daysUntilSunday = (7 - target.getDay()) % 7
      target.setDate(target.getDate() + daysUntilSunday)
      break
    }
  }

  // Seconds until the next interval.
  return Math.ceil((target.getTime() - nowMilliseconds) / 1000)
}

export function parseMaxAge(v: MaxAge, now: number): number {
  if (typeof v === 'number') {
    if (v === CACHE_PERMANENT || v === CACHE_NEVER) {
      return v
    }
    return Math.max(Math.floor(v), -1)
  } else if (
    v === 'next-hour' ||
    v === 'midnight' ||
    v === 'end-of-week' ||
    v === 'next-quarter-hour'
  ) {
    return calculateInterval(v, now)
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

export function isExpired(expires: number, now: number): boolean {
  if (expires === CACHE_PERMANENT) {
    return false
  } else if (expires === CACHE_NEVER) {
    return true
  }

  return expires < now
}

export function toTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export function expiresToMaxAge(expires: number, now: number): number {
  if (expires === CACHE_PERMANENT) {
    return CACHE_PERMANENT
  } else if (expires === CACHE_NEVER) {
    return CACHE_NEVER
  }

  const remaining = Math.floor(expires - now)
  return Math.max(remaining, 0)
}
