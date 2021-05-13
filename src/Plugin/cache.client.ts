export class RouteCacheHelperClient {
  setCacheable() {}
  seUncacheable() {}
  addTags() {}
  addCacheGroup() {}
  setDataCache() {}
  setDataCacheTags() {}
  getDataCache() {}
}

export default (_context: any, inject: (key: string, value: any) => void) => {
  inject('routeCache', new RouteCacheHelperClient())
}
