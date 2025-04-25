export type CacheStatsResponse<T> = {
  status: 'OK'
  rows: { key: string; data: T }[]
  total: number
}
