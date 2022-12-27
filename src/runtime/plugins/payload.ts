import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  let current: string[] = []
  const asyncData = {
    __startTrack() {
      current = []
    },
    __endTrack(): string[] {
      const keys: string[] = [...current]
      current = []
      return keys
    },
  }

  const handler = {
    get(target: any, prop: any, receiver: any) {
      if (prop !== '__startTrack' && prop !== '__endTrack') {
        current.push(prop)
      }
      return Reflect.get(...arguments)
    },
  }
  const proxy = new Proxy(asyncData, handler)
  nuxtApp._asyncData = proxy
})
