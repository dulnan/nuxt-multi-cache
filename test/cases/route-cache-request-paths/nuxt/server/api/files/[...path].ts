import { defineEventHandler } from 'h3'

/**
 * Answers every path below /api/files.
 */
export default defineEventHandler(() => {
  return { handler: 'files' }
})
