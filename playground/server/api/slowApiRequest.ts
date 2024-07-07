import { defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#nuxt-multi-cache/composables'

let counter = -1

function getResponse() {
  counter++
  return Promise.resolve({ data: counter })
}

function getResponseWithDelay(): Promise<{ data: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getResponse())
    }, 2000)
  })
}

export default defineEventHandler<Promise<{ data: number }>>((event) => {
  const query = getQuery(event)

  useRouteCache((helper) => {
    helper.setCacheable().allowStaleWhileRevalidate().setMaxAge(1)
  }, event)

  if (query.slow === 'true') {
    return getResponseWithDelay()
  }

  return getResponse()
})
