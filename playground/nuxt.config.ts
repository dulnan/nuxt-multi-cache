import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from '..'
import users from './data/users.json'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],
  generate: {
    routes: users.map((v) => {
      return '/user/' + v.userId
    }),
  },
  multiCache: {
    route: {
      enabled: true,
    },
    component: {
      enabled: true,
    },
    api: {
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
  },
})
