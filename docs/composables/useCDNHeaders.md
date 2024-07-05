# useCDNHeaders

The `useCDNHeaders` composable which is included if the
[CDN feature](/features/cdn-cache-control) is enabled, expects a callback which
it will call with the helper as the first argument. Doing it this way allows
Rollup to remove the code from client bundles. This even includes the call to
`useCDNHeaders` itself, so there is 0 impact on client bundle size.

To manage the cache control properties (like maxAge, mustRevalidate, maxStale,
etc.) the [@tusbar/cache-control](https://github.com/tusbar/cache-control)
library is used.

In a Nuxt app context, the composable can be called without any argument. In a
server context, the composable expects the `H3Event` object as a single
argument.

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

## Methods

### set(key: string, value: any)

Set a value for a cache control property. Both arguments are fully typed, e.g.
you can see possible values in your IDE.

### setNumeric(key: string, value: number)

This method works for the following numeric properties:

- maxAge
- sharedMaxAge
- maxStaleDuration
- minFresh
- staleWhileRevalidate
- staleIfError

The method will only set the value **if it is lower than the current value**.

### private()

Sets `private` to `true` and sets the value of `public` to `false`. Use this if
you want to make sure that the response is not cached on the CDN.

### public()

Marks the response as
[`public`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#public).
This means the response can be cached on a public cache. This is usually the
case for pages for anonymous users.

If the response was previously marked `private` then this has no effect: The
value of `public` will remain `false`.

### addTags(tags: string[])

Add cache tags for the Cache-Tag header. Duplicates will be automatically
removed.
