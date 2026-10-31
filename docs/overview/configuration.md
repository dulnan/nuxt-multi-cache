# Configuration

nuxt-multi-cache follows an "opt-in" approach, meaning: Just installing the
module will not add any caching to your app.

::: warning

Not all configuration options are available via `nuxt.config.ts`! Some have to
passed via the [server options configuration file](/overview/server-options), as
they need to be bundled in the server build (which is not possible via
`nuxt.config.ts`).

:::

## Adding and Enabling Features

A feature can be **added** and/or **enabled**, meaning:

- **added**: The feature is _generally_ added and available in your app (such as
  composables or components)
- **enabled**: The feature is enabled and will perform its functionality (such
  as caching)

This "two step" approach allows you to _generally_ add a composable like
`useDataCache`, while allowing you to disable the actual caching which is very
likely the case during local development or when debugging on deployed
applications. It's also possible to enable or disable a feature via
[runtime config](/overview/runtime-config).

### Example

This adds all composables for the [data cache](/features/data-cache) and also
enables all caching:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    data: {
      enabled: true,
    },
  },
})
```

This will still add all composables, but disable actual caching:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    data: {
      enabled: false,
    },
  },
})
```

None of the composables are added, therefore it's not possible to use the data
cache at all:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {},
})
```

## Full example

This example uses every possible configuration option.

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    // Component cache is enabled.
    component: {
      enabled: true,
    },

    // Data cache enabled.
    data: {
      enabled: true,
    },

    // Route cache is disabled. But because the `route` property is set the
    // useRouteCache composable is still added to the build, it just doesn't
    // cache.
    route: {
      enabled: false,
    },

    // CDN Cache Control Headers feature.
    cdn: {
      enabled: true,

      // Set custom cache control for Cloudflare.
      // Default: 'Surrogate-Control'
      cacheControlHeader: 'CDN-Cache-Control',

      // Set custom cache tags header for Cloudflare.
      // Default: 'Cache-Tag'
      cacheTagHeader: 'Cache-Tag',
    },

    // Cache Management API.
    api: {
      enabled: true,

      // Use a different prefix for the API endpoints.
      // Default: '/__nuxt_multi_cache'
      prefix: '/api/nuxt-multi-cache',

      // Disable authorization check on the API.
      authorization: false,

      // Cache tag invalidations should be buffered for 5 minutes before the
      // cache items are actually purged.
      // Default: 60000 (1 minute)
      cacheTagInvalidationDelay: 300000, // 5 minutes
    },

    // Log detailed debugging messages, e.g. when items are cached or returned
    // from cache.
    debug: true,

    // Disable logging a cache overview when the app starts.
    disableCacheOverviewLogMessage: true,

    // Allow overriding the current time with the
    // x-nuxt-multi-cache-date-override request header (an ISO date string).
    // Only use this in tests, see "Test Mode" below.
    enableTestMode: process.env.E2E === 'true',
  },
})
```

## Test Mode

With `enableTestMode`, any request can override the current time of the caches
with the `x-nuxt-multi-cache-date-override` header. This makes it possible to
test expiry and stale behavior in e2e tests.

::: danger

Never deploy a build with test mode enabled. Anyone could make cache items
expire, or keep them cached far beyond their max age. The server logs a warning
at startup if test mode is enabled.

:::

Test mode is a build option, because e2e tests (for example with
`@nuxt/test-utils`) run against a production build. Enable it only for the
builds of your tests, for example with an environment variable as in the example
above, or with Nuxt's `$test` override, which applies if `NODE_ENV` is `test`
while the app is built:

```typescript
export default defineNuxtConfig({
  $test: {
    multiCache: {
      enableTestMode: true,
    },
  },
})
```

## Reference

<<< @/../src/build/options/index.ts
