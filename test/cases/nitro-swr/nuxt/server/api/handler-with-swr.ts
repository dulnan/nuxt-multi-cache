import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const { value, addToCache } = await useDataCache('time-in-api', event)

  if (value) {
    return {
      time: value,
    }
  }

  const time = Date.now().toString()
  await addToCache(time)

  return { time }
})
