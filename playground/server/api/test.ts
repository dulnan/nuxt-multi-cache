export default defineEventHandler((event) => {
  return {
    api: 'This is data from the API.',
    cacheTags: ['page:1', 'image:234', 'user:32', 'language', 'translations'],
  }
})
