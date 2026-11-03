import { defineEventHandler, getRequestHeaders } from 'h3'

/**
 * Returns the names of the request headers it received.
 */
export default defineEventHandler((event) => {
  return { headers: Object.keys(getRequestHeaders(event)).sort() }
})
