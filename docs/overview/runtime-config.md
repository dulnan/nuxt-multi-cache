# Runtime Config

Some of the module's options can also be changed at runtime using
[runtime config](https://nuxt.com/docs/guide/going-further/runtime-config).

::: info

Note that you can only enable features via runtime config that are **also
enabled in the module config**. For example, you can _generally_ enable the
route cache in the module's options and then disable it at runtime, but you can
not have the route cache disabled in the module config and then enable it using
runtime config.

:::

## Enable debug

```dotenv
NUXT_MULTI_CACHE_DEBUG=true
```

If `true` the module will log debug message to the console.

## Toggle CDN Headers

```dotenv
NUXT_MULTI_CACHE_CDN_ENABLED=true
```

Either `true` or `false` to enable or disable the CDN headers.

## CDN Cache-Control Header

```dotenv
NUXT_MULTI_CACHE_CDN_CACHE_CONTROL_HEADER=Surrogate-Control
```

The name of the header to use for the CDN cache control.

## CDN Cache-Tag Header

```dotenv
NUXT_MULTI_CACHE_CDN_CACHE_TAG_HEADER=Surrogate-Keys
```

The name of the header to use for the CDN cache tags.

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

Set to `true` to enable the purge/stats API endpoints, `false` to disable them.

## API Cache Tag Invalidation Delay

```dotenv
NUXT_MULTI_CACHE_API_CACHE_TAG_INVALIDATION_DELAY=120
```

Set the delay for purging cache tags.

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
