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
    // The module options syntax is such that if the key of a feature is
    // completely undefined, then the feature is completely disabled.
    // If any object is provided, then the feature is generally enabled,
    // meaning that its functionality is included (such as composables or
    // components), however it's not actually fully enabled.
    // Whether a feature is fully enabled is decided using runtime config.
    const cdnEnabled = !!helper.options.cdn
    const routeCacheEnabled = !!helper.options.route
    const componentCacheEnabled = !!helper.options.component
    const dataCacheEnabled = !!helper.options.data

    return `
export const debug = ${JSON.stringify(!!helper.options.debug)}
export const cdnCacheControlHeader = import.meta.server ? ${JSON.stringify(helper.options.cdn?.cacheControlHeader || DEFAULT_CDN_CONTROL_HEADER)} : ''
export const cdnCacheTagHeader = import.meta.server ? ${JSON.stringify(helper.options.cdn?.cacheTagHeader || DEFAULT_CDN_TAG_HEADER)} : ''
export const cdnEnabled = ${JSON.stringify(cdnEnabled)}
export const routeCacheEnabled = ${JSON.stringify(routeCacheEnabled)}
export const componentCacheEnabled = ${JSON.stringify(componentCacheEnabled)}
export const dataCacheEnabled = ${JSON.stringify(dataCacheEnabled)}
export const shouldLogCacheOverview = ${JSON.stringify(!helper.options.disableCacheOverviewLogMessage)}
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
 * Whether the component cache is enabled at build time.
 *
 * The cache may still be disabled at runtime via runtime config.
 */
export declare const componentCacheEnabled: boolean

/**
 * Whether the data cache is enabled at build time.
 *
 * The cache may still be disabled at runtime via runtime config.
 */
export declare const dataCacheEnabled: boolean

/**
 * The delay in milliseconds before invalidating cache tags.
 */
export declare const cacheTagInvalidationDelay: number

/**
 * Whether the cache overview should be logged to the console.
 */
export declare const shouldLogCacheOverview: boolean

/**
 * Alias for import.meta.server, used for mocking in tests.
 */
export declare const isServer: boolean
`
  },
)
