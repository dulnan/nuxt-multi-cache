import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  return {
    value: (query.value || '').toString(),
    cacheTags: ['return-same-value'],
    currentTime: Date.now(),
  }
})
