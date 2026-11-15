import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

let renders = 0

export default defineEventHandler(async (event) => {
  renders++
  const render = renders
  const startedAt = Date.now()

  useRouteCache((helper) => {
    helper.setUncacheable()
  }, event)

  await new Promise((resolve) => setTimeout(resolve, 500))

  return { render, startedAt, endedAt: Date.now() }
})
