import { defineEventHandler } from 'h3'

/**
 * Returns user-generated content, which is inert in a JSON response.
 */
export default defineEventHandler(() => {
  return {
    comment: '<img src=x onerror=document.title=1337>',
  }
})
