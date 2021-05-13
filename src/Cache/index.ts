export interface CacheEntries {
  total: number
  rows: any[]
}

export interface Cache {
  set(key: string, data: string, tags?: string[]): Promise<boolean>
  get(key: string): Promise<any>
  has(key: string): Promise<boolean>
  getEntries(offset?: number): Promise<CacheEntries>
}

export interface RouteCache {
  set(route: string, data: string, tags?: string[]): Promise<boolean>
}
