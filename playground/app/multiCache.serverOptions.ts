import { defineDriver } from 'unstorage'
import { defineMultiCacheOptions } from './../../src/module'

const customDriver = defineDriver(() => {
  let cache: Record<string, string> = {}
  return {
    hasItem(key: string) {
      return !!cache[key]
    },
    getItem(key: string) {
      if (key === 'static_item_for_test') {
        return JSON.stringify({ data: 'just_an_example_value' })
      }
      return cache[key]
    },
    setItem(key, value) {
      cache[key] = value
    },
    removeItem(key) {
      delete cache[key]
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
