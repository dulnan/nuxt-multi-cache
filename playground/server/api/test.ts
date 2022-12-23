export default defineEventHandler((event) => {
  console.log('API Test is called.')
  return {
    api: 'This is data from the API.',
    cacheTags: ['page:1', 'image:234', 'user:32', 'language', 'translations'],
  }
})
