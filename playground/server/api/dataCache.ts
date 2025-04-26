import { defineEventHandler } from 'h3'
import { useDataCache } from '#imports'

function getData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.round(Math.random() * 100000000).toString())
    }, 500)
  })
}

export default defineEventHandler(async (event) => {
  const { value, addToCache } = await useDataCache('apiDataCacheTest', event)
  if (value) {
    return { data: value }
  }

  const data = await getData()
  addToCache(data)

  return { data }
})
