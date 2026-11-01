import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().addTags(['api'])
  }, event)

  return {
    renderId: crypto.randomUUID(),
  }
})
