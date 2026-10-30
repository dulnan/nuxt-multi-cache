export const SERVER_REQUEST_HEADER = 'x-nuxt-multi-cache-request'
export const ROUTE_CACHE_TAGS_HEADER = 'x-nuxt-multi-cache-cache-tags'
export const TEST_MODE_DATE_OVERRIDE_HEADER = 'x-nuxt-multi-cache-date-override'

/**
 * Response headers that are only set for internal requests from the Nuxt app
 * during SSR. They describe a single request, so they are never stored in the
 * route cache.
 */
export const INTERNAL_RESPONSE_HEADERS = [ROUTE_CACHE_TAGS_HEADER]
