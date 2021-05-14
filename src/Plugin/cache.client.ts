// Create a mock plugin for use in a client context.
export default (_context: any, inject: (key: string, value: any) => void) => {
  inject('cache', {
    route: {
      setCacheable() {},
      setUncacheable() {},
      addTags() {},
    },
    data: {
      set() {},
      get() {},
    },
    groups: {
      set() {},
      get() {},
    }
  })
}
