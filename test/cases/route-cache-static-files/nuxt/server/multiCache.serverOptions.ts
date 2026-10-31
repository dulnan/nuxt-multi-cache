import memoryDriver from 'unstorage/drivers/memory'
import { defineMultiCacheOptions } from './../../../../../src/server-options'
import { storageLookups } from './storageLookups'

const memory = memoryDriver()

export default defineMultiCacheOptions(() => {
  return {
    route: {
      storage: {
        // Records every route cache lookup.
        driver: {
          ...memory,
          getItemRaw(key, opts) {
            storageLookups.push(key)
            return memory.getItemRaw!(key, opts)
          },
        },
      },
    },
  }
})
