import { H3Event } from 'h3'
import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],
  multiCache: {
    component: {
      enabled: true,
    },
    route: {
      enabled: true,
    },

    data: {
      enabled: true,
    },

    cdn: {
      enabled: true,
    },
    api: {
      enabled: true,
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
    cacheKeyPrefix: (event: H3Event): Promise<string> => {
      return new Promise<string>((resolve) => {
        const lang = event?.node?.req?.headers['accept-language']
        resolve(lang?.includes('IT') ? 'IT' : 'EN')
      })
    },
  },
})
