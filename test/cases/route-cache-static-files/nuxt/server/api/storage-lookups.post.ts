import { defineEventHandler } from 'h3'
import { storageLookups } from '../storageLookups'

/**
 * Returns the route cache lookups since the last call.
 */
export default defineEventHandler(() => {
  return storageLookups.splice(0)
})
