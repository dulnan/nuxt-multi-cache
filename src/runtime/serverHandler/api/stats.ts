import { defineEventHandler } from 'h3'
import { checkAuth, getCacheInstance } from './helpers'

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const cache = getCacheInstance(event)
  const rows = await cache.getKeys().then((keys) => {
    return Promise.all(
      keys.map((key) => {
        return cache.getItem(key).then((data) => {
          return { key, data }
        })
      }),
    )
  })

  return {
    status: 'OK',
    rows,
    total: rows.length,
  }
})
