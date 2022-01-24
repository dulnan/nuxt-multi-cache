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
