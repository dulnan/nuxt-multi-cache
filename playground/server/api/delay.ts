import { useRouteCache } from '#nuxt-multi-cache'

const getResult = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: 'I am very delayed.' })
    }, 1000)
  })
}

export default defineEventHandler((event) => {
  const { setCacheable } = useRouteCache(event)
  setCacheable()
  return getResult()
})
