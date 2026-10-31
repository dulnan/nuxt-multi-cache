import { defineEventHandler, getQuery } from 'h3'

/**
 * Counts how often it was called. Used to check how often a handler ran.
 */
let count = 0

export default defineEventHandler((event) => {
  if (getQuery(event).read) {
    return { count }
  }

  count++
  return { count }
})
