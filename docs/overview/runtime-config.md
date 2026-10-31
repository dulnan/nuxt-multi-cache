# Runtime Config

Some of the module's options can also be changed at runtime using
[runtime config](https://nuxt.com/docs/guide/going-further/runtime-config).

::: info

You can only enable features via runtime config that are **added** in the module
config (see
[Adding and Enabling Features](/overview/configuration#adding-and-enabling-features)).
For example, with `route: { enabled: false }` in the module config,
`NUXT_MULTI_CACHE_ROUTE=true` enables the route cache at runtime. Without a
`route` key in the module config, it has no effect.

In addition, at least one feature (or the API) must have `enabled: true` in the
module config. Otherwise the module's server plugin is not added to the build
and none of the runtime config values have an effect.

:::

## Toggle CDN Headers

```dotenv
NUXT_MULTI_CACHE_CDN=true
```

Either `true` or `false` to enable or disable the CDN headers.

## Toggle Component Caching

```dotenv
NUXT_MULTI_CACHE_COMPONENT=true
```

Set to `true` to enable component caching or `false` to disable it.

## Toggle Data Cache

```dotenv
NUXT_MULTI_CACHE_DATA=true
```

Set to `true` to enable the data cache or `false` to disable it.

## Toggle Route Caching

```dotenv
NUXT_MULTI_CACHE_ROUTE=true
```

Set to `true` to enable route caching or `false` to disable it.

## Toggle API

```dotenv
NUXT_MULTI_CACHE_API_ENABLED=true
```

Set to `false` to disable the purge/stats API endpoints. Disabled endpoints
respond with a 404 status code, before any authorization check.

The endpoints are only added if `api.enabled` is `true` in the module config, so
this can't enable them.

## API Authorization Token

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN=PtSR0mDATQpNlvNgqRf
```

The token to use to grant access to the purge/stats API.

## Toggle API Authorization

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_DISABLED=true
```

Set to `true` to disable authorization checks for the purge/stats API.
