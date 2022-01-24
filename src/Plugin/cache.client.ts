// Create a mock plugin for use in a client context.
export interface CachePlugin {
  route: {
    setCacheable(): void
    setUncacheable(): void
    addTags(tags: string[]): void
  }
  data: {
    set(key: string, data: any, tags: string[]): void
    get(key: string): Promise<any>
  }
  groups: {
    add(name: string, tags: string[]): void
  }
}

export default (_context: any, inject: (key: string, value: any) => void) => {
  const mock: CachePlugin = {
    route: {
      setCacheable() {},
      setUncacheable() {},
      addTags() {},
    },
    data: {
      set() {},
      get() {
        return Promise.resolve()
      },
    },
    groups: {
      add() {},
    },
  }
  inject('cache', mock)
}

declare module 'vue/types/vue' {
  interface Vue {
    $cache: CachePlugin
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    readonly $cache: CachePlugin
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $cache: CachePlugin
  }
  interface Context {
    $cache: CachePlugin
  }
}
