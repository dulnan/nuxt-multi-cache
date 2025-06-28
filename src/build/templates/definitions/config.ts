import {
  DEFAULT_CACHE_TAG_INVALIDATION_DELAY,
  DEFAULT_CDN_CONTROL_HEADER,
  DEFAULT_CDN_TAG_HEADER,
} from '../../options/defaults'
import { defineTemplate } from '../defineTemplate'

export default defineTemplate(
  {
    path: 'nuxt-multi-cache/config',
  },
  (helper) => {
    return `
export const debug = ${JSON.stringify(!!helper.options.debug)}
export const cdnCacheControlHeader = import.meta.server ? ${JSON.stringify(helper.options.cdn?.cacheControlHeader || DEFAULT_CDN_CONTROL_HEADER)} : ''
export const cdnCacheTagHeader = import.meta.server ? ${JSON.stringify(helper.options.cdn?.cacheTagHeader || DEFAULT_CDN_TAG_HEADER)} : ''
export const cdnEnabled = ${JSON.stringify(!!helper.options.cdn?.enabled)}
export const cacheTagInvalidationDelay = ${JSON.stringify(helper.options.api?.cacheTagInvalidationDelay || DEFAULT_CACHE_TAG_INVALIDATION_DELAY)}
export const isServer = import.meta.server
`
  },
  () => {
    return `
export declare const debug: boolean
export declare const cdnCacheControlHeader: string
export declare const cdnCacheTagHeader: string
export declare const cdnEnabled: boolean
export declare const cacheTagInvalidationDelay: number
export declare const isServer: boolean
`
  },
)
