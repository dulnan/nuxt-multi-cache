import { defineEventHandler } from 'h3'
import { useDataCache } from '#imports'

export default defineEventHandler(async (event) => {
  const { value } = await useDataCache('static_item_for_test', event)
  return { value }
})
