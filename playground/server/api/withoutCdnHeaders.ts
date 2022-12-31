export default defineEventHandler(() => {
  return {
    api: 'This response should have no CDN headers.',
  }
})
