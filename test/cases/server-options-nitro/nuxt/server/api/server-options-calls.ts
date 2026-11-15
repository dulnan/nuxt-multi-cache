import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return (globalThis as { serverOptionsCalls?: number }).serverOptionsCalls ?? 0
})
