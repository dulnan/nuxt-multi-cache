import { defineEventHandler, getQuery } from 'h3'

/**
 * Takes the backend down ("?down=true") or up again, for pages whose URL must
 * stay the same while their rendering fails.
 */
export default defineEventHandler((event) => {
  ;(globalThis as any).__testBackendDown = getQuery(event).down === 'true'
  return 'OK'
})
