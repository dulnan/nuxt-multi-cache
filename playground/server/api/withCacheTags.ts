import { useRouteCache } from '#nuxt-multi-cache'

export default defineEventHandler((event) => {
  const { setCacheable } = useRouteCache(event)
  setCacheable().setMaxAge(234234)
  return {
    data: 'This response should contain cache headers.',
  }
})
