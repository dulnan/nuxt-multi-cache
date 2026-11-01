import { defineEventHandler } from 'h3'
import { capturedErrorTags } from '../utils/capturedErrorTags'

/**
 * Returns the tags of the errors captured since the last request, and clears
 * them.
 */
export default defineEventHandler(() => {
  return capturedErrorTags.splice(0)
})
