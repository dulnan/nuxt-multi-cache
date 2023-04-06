import { defineDriver } from 'unstorage'
import { defineMultiCacheOptions } from './../../src/module'

const customDriver = defineDriver(() => {
  let cache = {}
  return {
    hasItem(key: string) {
      console.log('hasItem: ' + key)
      return !!cache[key]
    },
    getItem(key: string) {
      console.log('getItem: ' + key)
      return cache[key]
    },
    setItem(key, value) {
      console.log('setItem: ' + key)
      cache[key] = value
    },
    removeItem(key) {
      cache[key] = undefined
    },
    getKeys() {
      return Object.keys(cache)
    },
    clear() {
      cache = {}
    },
    dispose() {},
  }
})

export default defineMultiCacheOptions({
  data: {
    storage: {
      driver: customDriver(),
    },
  },
  component: {},
})
