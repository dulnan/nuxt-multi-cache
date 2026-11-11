export const SERVER_REQUEST_HEADER = 'x-nuxt-multi-cache-request'
export const ROUTE_CACHE_TAGS_HEADER = 'x-nuxt-multi-cache-cache-tags'
export const ROUTE_CACHE_EXPIRES_HEADER = 'x-nuxt-multi-cache-expires'
export const ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER =
  'x-nuxt-multi-cache-stale-if-error-expires'
export const ROUTE_CACHE_UNCACHEABLE_HEADER = 'x-nuxt-multi-cache-uncacheable'
export const TEST_MODE_DATE_OVERRIDE_HEADER = 'x-nuxt-multi-cache-date-override'

/**
 * The name of the route cache in the Cache-Status header if the option is
 * `true`.
 */
export const DEFAULT_CACHE_STATUS_NAME = 'nuxt-multi-cache'

/**
 * How long concurrent requests wait for a route that another request renders,
 * in milliseconds, with `route.coalesce: true`.
 */
export const DEFAULT_ROUTE_COALESCE_TIMEOUT = 10_000

/**
 * Response headers that are only set for internal requests from the Nuxt app
 * during SSR. They describe a single request, so they are never stored in the
 * route cache.
 */
export const INTERNAL_RESPONSE_HEADERS = [
  ROUTE_CACHE_TAGS_HEADER,
  ROUTE_CACHE_EXPIRES_HEADER,
  ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
  ROUTE_CACHE_UNCACHEABLE_HEADER,
]
