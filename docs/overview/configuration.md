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
      cacheControlHeader: 'CDN-Cache-Control',

      // Set custom cache tags header for Cloudflare.
      cacheTagHeader: 'Cache-Tag',
    },

    // Cache Management API.
    api: {
      enabled: true,

      // Use a different prefix for the API endpoints.
      prefix: '/api/nuxt-multi-cache',

      // Disable authorization check on the API.
      authorization: false,

      // Cache tag invaldiations should be buffered for 5 minutes before the
      // cache items are actually purged.
      cacheTagInvalidationDelay: 300000, // 5 minutes
    },

    // Log detailled debugging messages, e.g. when items are cached or returned from cache.
    debug: true,

    // Disable logging a cache overview when the app starts.
    disableCacheOverviewLogMessage: true,
  },
})
```

## Reference

<<< @/../src/build/options/index.ts
