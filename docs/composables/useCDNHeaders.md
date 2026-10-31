# useCDNHeaders

Available in **Nuxt** and **Nitro**.

The `useCDNHeaders` composable which is included if the
[CDN feature](/features/cdn-cache-control) is enabled, expects a callback which
it will call with the helper as the first argument. Doing it this way allows
Rollup to remove the code from client bundles. This even includes the call to
`useCDNHeaders` itself, so there is 0 impact on client bundle size.

To manage the cache control properties (like maxAge, mustRevalidate, maxStale,
etc.) the [@tusbar/cache-control](https://github.com/tusbar/cache-control)
library is used.

In a Nuxt app context, the callback is the only required argument. In a server
context, the composable expects the `H3Event` object as the second argument.

## Full Example

```typescript
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 3600)
    .set('staleIfError', 24000)
    .set('staleWhileRevalidate', 60000)
    .set('mustRevalidate', true)
    .addTags(['api'])
})
```

## Arguments

### callback: `(cache: NuxtMultiCacheCDNHelper) => void`

The callback that receives the CDN cache helper. The callback is only called on
the server.

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

### applyToEvent?: `boolean`

Whether to set the headers on the response right away. Defaults to `true`.

If `false`, the values are only collected. In a Nuxt app, they are set on the
response when the page has been rendered. In a Nitro server context, a later
call with `applyToEvent` set to `true` (or omitted) sets them.

## Methods

### set(key: string, value: any)

Set a value for a cache control property. Both arguments are fully typed, e.g.
you can see possible values in your IDE.

### setNumeric(key: string, value: MaxAge)

This method works for the following numeric properties:

- maxAge
- sharedMaxAge
- maxStaleDuration
- minFresh
- staleWhileRevalidate
- staleIfError

The method will only set the value **if it is lower than the current value**.

`maxStaleDuration` is only added to the header if `maxStale` is also set using
`setBoolean('maxStale')`.

The value can be any [max age](/overview/max-age). `'permanent'` (or `-1`) means
"no limit": It neither sets the directive nor replaces a lower value.

### setBoolean(key: string)

This method works for the following boolean properties:

- immutable
- maxStale
- mustRevalidate
- mustUnderstand
- noCache
- noStore
- noTransform
- onlyIfCached
- proxyRevalidate

The method will always set the boolean value to `true`.

### private()

Sets `private` to `true` and sets the value of `public` to `false`. Use this if
you want to make sure that the response is not cached on the CDN. The module
then also adds `private` to the `Cache-Control` header, see
[Private Responses](/features/cdn-cache-control#private-responses).

### public()

Marks the response as
[`public`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#public).
This means the response can be cached on a public cache. This is usually the
case for pages for anonymous users.

If the response was previously marked `private` then this has no effect: The
value of `public` will remain `false`.

### addTags(tags: string | string[])

Add cache tags for the cache tags header (configured via `cdn.cacheTagHeader`,
by default `Cache-Tag`). Duplicates will be automatically removed.

### mergeFromResponse(response: FetchResponse)

Merges the cache tags and cache control from the given fetch response.

Merging never sets a higher max age than currently or marks the response as
public. A merged `s-maxage` never exceeds the lifetime the response has for
shared caches either (see
[Bubbling Cacheability](/overview/bubble-cacheability#what-bubbles)).

```typescript
const event = useRequestEvent()

const { data } = await useAsyncData(() => {
  return $fetch.raw('/api/load-users').then((response) => {
    useCDNHeaders((cdn) => {
      cdn.mergeFromResponse(response)
    }, event)

    return response._data
  })
})
```

### mergeCacheControlHeader(header: string)

Parses and merges the given `Cache-Control` header value.

### mergeFromCacheItem(item: CacheableItemInterface)

Merges the cache tags, max age and stale if error duration of a cache item, for
example an item of the data cache. Used to
[bubble cacheability](/overview/bubble-cacheability).

### mergeFromCacheability(cacheability: CacheabilityInterface)

Merges the cache tags, max age and stale if error duration of another cache
helper. If the helper is marked as uncacheable, the max age is set to `0` and
`no-store` is added, so that the CDN doesn't store the response at all. An
`s-maxage` is lowered to `0` as well, and `Cache-Control` gets `private` (see
[Private Responses](/features/cdn-cache-control#private-responses)). Used to
[bubble cacheability](/overview/bubble-cacheability).

### getMaxAge(), getStaleIfError(), getTags()

Return the current max age, stale if error duration (both `null` if not set) and
cache tags.

### applyToEvent(event: H3Event)

Sets the headers on the response of the given event. `useCDNHeaders` already
does this, unless its `applyToEvent` argument is `false`.

### addCustomDirective(name: string, value?: string | number | true)

Adds a directive that is not part of the standard specification to the CDN cache
control header (configured via `cdn.cacheControlHeader`, by default
`Surrogate-Control`). Some CDN providers support proprietary directives, for
example Netlify's
[`durable`](https://docs.netlify.com/platform/caching/#durable-directive)
directive.

::: info

The directive only has an effect if your CDN reads the configured header.
Netlify for example only reads `Netlify-CDN-Cache-Control`, `CDN-Cache-Control`
and `Cache-Control`, so set `cdn.cacheControlHeader` to
`Netlify-CDN-Cache-Control` to use `durable`.

:::

Pass `true` (the default) for a valueless boolean directive, or a `string` /
`number` for a directive with a value.

Directive names are case-insensitive and are added in lowercase. Adding the same
directive again replaces its value. Standard directives such as `public` or
`max-age` can't be added this way; use the other methods instead. Invalid names
and values that can't be represented in a header (such as negative numbers or
strings containing line breaks) are skipped and a warning is logged.

```typescript
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 3600)
    // boolean (valueless) directive
    .addCustomDirective('durable')
    // directive with a value
    .addCustomDirective('cdn-ttl', 7200)
})
```

With the default config this will set the following header on the response:

```http
Surrogate-Control: max-age=3600, public, durable, cdn-ttl=7200
```

Custom directives are not merged from other responses: `mergeFromResponse()` and
`mergeCacheControlHeader()` only pick up standard directives.
