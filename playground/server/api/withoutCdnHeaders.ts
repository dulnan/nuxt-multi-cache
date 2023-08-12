import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return {
    api: 'This response should have no CDN headers.',
  }
})
