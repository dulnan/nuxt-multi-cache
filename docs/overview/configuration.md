# Configuration

::: warning

Not all configuration options are available via nuxt.config.ts! Some have to
passed via the [server options configuration file](/overview/server-options).

:::

## Minimal

By default no features are enabled and no functionality is added to your Nuxt
app.

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache']
}
```

## Full example

This example uses every possible configuration option.

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

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
    cacheTagHeader: 'Cache-Tag'
  },

  // Cache Management API.
  api: {
    enabled: true,

    // Use a different prefix for the API endpoints.
    prefix: '/api/nuxt-multi-cache',

    // Cache tag invaldiations should be buffered for 5 minutes before the
    // cache items are actually purged.
    cacheTagInvalidationDelay: 300000 // 5 minutes
  },

  // Log detailled debugging messages, e.g. when items are cached or returned from cache.
  debug: true
}
```

## Reference

<<< @/../src/runtime/types.ts
