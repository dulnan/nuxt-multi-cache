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
export const routeCacheEnabled = ${JSON.stringify(!!helper.options.route?.enabled)}
export const cacheTagInvalidationDelay = ${JSON.stringify(helper.options.api?.cacheTagInvalidationDelay || DEFAULT_CACHE_TAG_INVALIDATION_DELAY)}
export const isServer = import.meta.server
`
  },
  () => {
    return `
/**
 * Whether debug mode is enabled at build time.
 */
export declare const debug: boolean

/**
 * Whether the CDN feature is enabled at build time.
 *
 * The feature may still be disabled at runtime via runtime config.
 */
export declare const cdnEnabled: boolean

/**
 * The CDN cache control header name.
 */
export declare const cdnCacheControlHeader: string

/**
 * The CDN cache tag header name.
 */
export declare const cdnCacheTagHeader: string

/**
 * Whether the route cache is enabled at build time.
 *
 * The cache may still be disabled at runtime via runtime config.
 */
export declare const routeCacheEnabled: boolean

/**
 * The delay in milliseconds before invalidating cache tags.
 */
export declare const cacheTagInvalidationDelay: number

/**
 * Alias for import.meta.server, used for mocking in tests.
 */
export declare const isServer: boolean
`
  },
)
