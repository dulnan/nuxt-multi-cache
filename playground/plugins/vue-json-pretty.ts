import VueJsonPretty from 'vue-json-pretty'
import { defineNuxtPlugin } from '#app'
export default defineNuxtPlugin((nuxtApp) => {
  const Vue = nuxtApp.vueApp
  Vue.component('VueJsonPretty', VueJsonPretty)
})
