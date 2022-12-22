import type { CreateStorageOptions, Storage } from 'unstorage'

export interface MultiCacheOptions {
  enabled?: boolean
  storage?: CreateStorageOptions
}

export interface NuxtMultiCacheOptions {
  caches?: {
    component?: MultiCacheOptions
    data?: MultiCacheOptions
    route?: MultiCacheOptions
  }
  api?: {
    prefix?: string
  }
}

export interface NuxtMultiCacheSSRContext {
  component?: Storage
  data?: Storage
  route?: Storage
}

export interface NuxtMultiCacheRouteContext {
  tags: string[]
  cacheable: boolean | null
  maxAge: number | null
}
