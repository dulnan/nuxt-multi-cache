import { defineEventHandler } from 'h3'

/**
 * A path the route cache doesn't handle: By default, paths ending in ".css"
 * are excluded.
 */
export default defineEventHandler(() => {
  return 'body {}'
})
