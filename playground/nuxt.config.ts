import { defineNuxtConfig } from 'nuxt/config'
import users from './data/users.json'
import NuxtMultiCache from '..'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],
  generate: {
    routes: users.map((v) => {
      return '/user/' + v.userId
    }),
  },
})
