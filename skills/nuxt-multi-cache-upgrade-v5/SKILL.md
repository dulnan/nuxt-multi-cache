---
name: nuxt-multi-cache-upgrade-v5
description: Upgrade a Nuxt app from nuxt-multi-cache 4.x to 5.x and check every breaking and behavior change against the project's code and config. Use when updating nuxt-multi-cache to 5, or when caching behaves differently after the update.
license: MIT
---

# Upgrade nuxt-multi-cache to 5.x

Most changes in 5.0 fix caching bugs. They change what is cached and for how
long, and the build and the type checker don't notice them. Find each change in
the project and report it with evidence.

## Steps

1. **Read the setup.** Find the installed version in the lockfile, the
   `multiCache` options in `nuxt.config`, `server/multiCache.serverOptions.ts`,
   `.env*` files and deployment config (Dockerfile, CI workflows, platform
   config). Done when you can name every added feature (`cdn`, `component`,
   `data`, `route`, `api`) and the storage driver of each cache.
2. **Check the requirements.** 5.x needs Nuxt `^4.0.0` and Node
   `^20.19.0 || >=22.12.0`. On Nuxt 3 the module isn't loaded: stop and tell the
   user to upgrade Nuxt first. Check every place that pins Node (`engines`,
   `.nvmrc`, `.node-version`, CI, Dockerfile).
3. **Install** `nuxt-multi-cache@^5` with the project's package manager. If
   the install fails because a patch of the module doesn't apply, continue with
   item 31 first.
4. **Check every item** of the checklist below, searching the whole project
   except `node_modules` and build output. Give each item a verdict:
   - **affected**, with `file:line` of each match the change applies to;
   - **not affected**, with the search that found nothing, or why the matches
     don't apply;
   - **outside the repo**, when it depends on the deployment, the storage or the
     CDN.

   Apply the **Do** of each affected item. **Report** means: leave the code as
   it is and list the item for the user, because the new behavior is usually the
   correct one and changing it is the user's decision. Done when every item has
   a verdict with evidence.

5. **Run** the project's typecheck, lint, build and tests from `package.json`,
   and fix what fails.
6. **Check that caching works** for every page and component an affected item
   touches, with the checks of the `nuxt-multi-cache` skill.
7. **Report** in the format at the end.

## Checklist

### Max age and the data cache

1. **A max age of 0 means "never".** `addToCache(value, tags, 0)`,
   `setMaxAge(0)` or `setMaxAge('never')` in a `useDataCacheCallback` callback,
   and `serverMaxAge: 0` stored the item permanently. Now they don't cache.
   - Search: `addToCache(`, `setMaxAge(`, `serverMaxAge`, `'never'`.
   - Do: report. These items are now fetched on every request.
2. **`useCachedAsyncData` without `serverMaxAge` doesn't cache on the server**,
   also when the `serverMaxAge` function returns `undefined`. It cached
   permanently. The items 4.x stored for it are no longer read.
   - Search: `useCachedAsyncData(`.
   - Do: report, and propose `serverMaxAge: 'permanent'` (the 4.x behavior) or a
     max age that fits the data.
     [Options](https://nuxt-multi-cache.dulnan.net/composables/useCachedAsyncData#options-cachedasyncdataoptions)
3. **Negative max ages other than `-1`, and `NaN`, mean "never".** They meant
   "permanent", e.g. a computed `expiresAt - now` that is already in the past.
   `Infinity` now means "permanent".
   - Search: max ages computed from dates or arithmetic in `setMaxAge(`,
     `addToCache(`, `serverMaxAge`, `clientMaxAge`, `:max-age`.
   - Do: report.
     [Special numbers](https://nuxt-multi-cache.dulnan.net/overview/max-age#special-numbers)
4. **`'permanent'` no longer raises a lower max age.** `setMaxAge(300)` followed
   by `setMaxAge('permanent')` stays 300; the lowest value always wins.
   - Search: `'permanent'`, `setMaxAge(-1`.
   - Do: report calls that use `'permanent'` to reset or raise a max age set
     earlier.
5. **`clientMaxAge` accepts every max age.** Before, only positive numbers
   cached on the client; `'5m'`, `'permanent'` and `-1` were stored but never
   served.
   - Search: `clientMaxAge`.
   - Do: replace an invalid string, which throws, with the number of seconds
     it means (`'3h'` → `10800`). Report the others: they now cache on the
     client.
     [Valid strings](https://nuxt-multi-cache.dulnan.net/overview/max-age#named-absolute-duration)
6. **Falsy values are cache hits.** `useDataCacheCallback` and
   `useCachedAsyncData` return a cached `0`, `false`, `''` or `null` instead of
   fetching again.
   - Search: callbacks and handlers of `useDataCacheCallback(` and
     `useCachedAsyncData(` that return `null`, `false`, `''` or `0`, e.g. for
     "not found" or a failed request.
   - Do: report. A fallback that should be fetched again needs
     `helper.setUncacheable()` in the callback, or a `serverMaxAge` function
     that returns `0` for it.

### Bubbling

7. **Uncacheable items bubble.** With `bubbleCacheability`, a data cache item or
   a `<RenderCacheable>` whose content calls `setUncacheable()` makes the page
   uncacheable: no route cache, and `max-age=0, no-store` in the CDN header. A
   `useDataCacheCallback` result is no longer stored after `setUncacheable()`.
   - Search: `bubbleCacheability`, `setUncacheable(`.
   - Do: report the pages that are no longer cached.
     [What bubbles](https://nuxt-multi-cache.dulnan.net/overview/bubble-cacheability#what-bubbles)
8. **The fetch interceptor bubbles more from API routes.** The max age,
   stale-if-error and "uncacheable" of route cached API routes now bubble into
   the page, not only their cache tags.
   - Search: `useCacheAwareFetchInterceptor`, then the API routes those pages
     fetch that call `useRouteCache`.
   - Do: report pages that now expire earlier or are no longer cached.
9. **The fetch interceptor only bubbles from relative URLs.** Fetches to
   absolute URLs, even to the app itself, no longer bubble route cache values.
   Clients that send `x-nuxt-multi-cache-request: true` no longer get the
   internal headers.
   - Search: absolute URLs or an absolute `baseURL` in fetches of pages that use
     the interceptor; `x-nuxt-multi-cache-request` anywhere, also in scripts and
     tests.
   - Do: use relative URLs (`/api/...`) for the app's own API routes. Report
     uses of the header.
     [Relative URLs only](https://nuxt-multi-cache.dulnan.net/composables/useCacheAwareFetchInterceptor#relative-urls-only)

### Component cache

10. **A child with slot content needs a `cache-key`.** The generated key only
    contains the child's name and props, so a `<RenderCacheable>` whose child
    receives slot content is no longer cached without `cache-key`. This also
    covers `<NuxtLink>text</NuxtLink>`, `<Transition>`, named slots and a
    nested `<RenderCacheable>` as the child. The same applies to a lazy child
    (`<LazyFoo>`): all lazy components share one name.
    - Search: every `<RenderCacheable>`; check whether its child has content
      between its tags or is a `Lazy` component.
    - Do: report. Propose a `cache-key` only for slot content that is the same
      for every request, unique for each distinct content. Content that differs
      per request (user data, query values) has to be part of the key.
      [Slot content](https://nuxt-multi-cache.dulnan.net/features/component-cache#slot-content)
11. **A forwarded slot with a `cache-key` is cached.** A wrapper component that
    passes its own slot into `<RenderCacheable>` was never cached. With a
    `cache-key`, it now is. The same applies to a `v-for` or a `<template>`
    with several children as the first node. A layout that wraps its page
    `<slot />` like this now caches whole pages, without their head tags and
    payload.
    - Search: components with a `<slot` inside `<RenderCacheable>`, including
      layouts; `<RenderCacheable>` with a `cache-key` whose first node is a
      `v-for` or a `<template>`.
    - Do: report each wrapper whose `cache-key` doesn't cover everything passed
      into its slot: it now serves the first render to everyone. Report every
      layout that wraps the page this way.
      [Wrapper components](https://nuxt-multi-cache.dulnan.net/features/component-cache#wrapper-components)
12. **Nested `<RenderCacheable>` instances merge into the outer one.** An inner
    `no-cache` or uncacheable instance makes the outer one uncacheable, and the
    inner max age and cache tags apply to the outer item. This also passes
    through an instance in between that renders uncached (e.g. its first child
    is an element), so `useComponentCache()` in its slot affects the outer one.
    - Search: `<RenderCacheable>` inside the content of another, also through
      child components.
    - Do: report outer instances that are no longer cached or expire earlier.
      [Nesting](https://nuxt-multi-cache.dulnan.net/features/component-cache#nesting)

### Route cache

13. **Only GET and HEAD requests use the route cache.** Responses to other
    methods are neither served from nor stored in the route cache. Their route
    cache values still bubble to a page that fetches them with
    `useCacheAwareFetchInterceptor`.
    - Search: `useRouteCache` in server routes for other methods (`.post.ts`,
      `.put.ts`, method checks in the handler).
    - Do: report.
14. **A stale route is only served for server errors** (5xx and unhandled
    errors). A 404 no longer serves the stale copy.
    - Search: `setStaleIfError`, `staleIfError`; error handling that throws a
      4xx when a backend fails.
    - Do: report. Backend failures need a 5xx status to serve the stale copy.
      [Stale if error](https://nuxt-multi-cache.dulnan.net/overview/stale-if-error#route-cache)
15. **A stale route is sent with the headers of a cache hit:** the ones set
    before any handler ran (Nitro `request` hooks) and the cached headers.
    Headers that the failed request had set in middleware, the handler or the
    page were sent along, including cookies such as a renewed session.
    - Search: `setStaleIfError`, `staleIfError`; on those routes, headers and
      cookies set in `server/middleware/`, server routes and pages
      (`setCookie(`, `useCookie(`, `setResponseHeader(`).
    - Do: report. Headers that every response needs, also a stale one, belong
      in a Nitro `request` hook or must be stored with the route.
      [Stale if error](https://nuxt-multi-cache.dulnan.net/overview/stale-if-error#route-cache)
16. **The app's error handler isn't called when a stale route is served.**
    The module's Nitro error handler responds first. Nitro still logs the
    error and calls its `error` hook, but a custom `nitro.errorHandler` that
    reports errors no longer sees them.
    - Search: `errorHandler` in the `nitro` options, `defineNitroErrorHandler`.
    - Do: report. Error reporting belongs in the Nitro `error` hook
      (`nitroApp.hooks.hook('error', ...)` in a server plugin).
      [Stale if error](https://nuxt-multi-cache.dulnan.net/overview/stale-if-error#route-cache)
17. **Browsers get a stale route with its cached status code.** For requests
    that accept HTML, the stale route was sent with the error status (500 or
    503). Now it's a 200 with the cached headers, so a CDN may store it for the
    cached max age.
    - Search: `setStaleIfError`, `staleIfError`; CDN headers on those routes
      (`useCDNHeaders`).
    - Do: report. Mark it outside the repo when the CDN's config decides what
      it stores.
18. **`route.applies` gets the decoded path**, and static files are detected
    without the query string. Paths excluded by `applies` skip the route cache
    entirely, including `enabledForRequest`. An `enabledForRequest` that throws
    no longer fails the request with a 500: the page renders without the route
    cache, and nothing is logged. Paths below the `api.prefix` are always
    excluded, also with the API disabled.
    - Search: `applies` and `enabledForRequest` in the server options;
      `api.prefix` in the module options.
    - Do: match decoded characters (`é` instead of `%C3%A9`). Report a check
      that relied on the query string, an `enabledForRequest` that can throw
      (it has to catch and log errors itself), and app routes below the
      `api.prefix`.
      [applies](https://nuxt-multi-cache.dulnan.net/overview/server-options#applies)
19. **`state.keysBeingRevalidated` is a `Map`** of start times instead of a
    `Set`.
    - Search: `keysBeingRevalidated`.
    - Do: adapt the code; `has()` and `delete()` still work.

### Cache keys and purging

20. **Keys with a `?` are neither read nor stored.** The storage dropped
    everything after the `?`, so different keys shared one item. Affects
    `buildCacheKey`, data cache keys and `cache-key` props built from query
    values or URLs.
    - Search: `buildCacheKey`, and keys of `useDataCache(`,
      `useDataCacheCallback(`, `useCachedAsyncData(` and `cache-key` that
      include a query string or URL.
    - Do: build the key from validated values of known parameters, e.g.
      `` `products:${id}` `` after checking that `id` is a number, or from a hash
      of them. A raw query value can also contain `..`, which the storage
      rejects.
      [Cache keys](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#cache-keys)
21. **A `cacheKeyPrefix` method that returns no prefix gets `{none}`.** Keys of
    such requests are now `{none}--<key>`.
    - Search: `cacheKeyPrefix` in the server options.
    - Do: report if the method can return `''` or no string. Existing items of
      these requests are missed once.
      [Dynamic prefix](https://nuxt-multi-cache.dulnan.net/overview/server-options#dynamic)
22. **Purging and inspecting by key use new keys** for the cases of item 21 and,
    without a cache key prefix, for the root path, which is stored as `{root}`.
    - Search: calls of the purge and inspect API (`/__nuxt_multi_cache/` or the
      configured `api.prefix`) in scripts, CMS hooks and CI.
    - Do: use `{none}--<key>`, and `{root}` for the root path. With a prefix,
      the root path stays `<prefix>--`.
      [Cache key for routes](https://nuxt-multi-cache.dulnan.net/features/route-cache#cache-key-for-routes)

### CDN headers

23. **`Cache-Control` gets `private` when the CDN header is `private` or
    `no-store`.** Fastly ignores both in `Surrogate-Control`. `public` is
    removed from an existing `Cache-Control`, other directives stay.
    - Search: the `cdn` feature in the module options. Every project with it
      is affected unless `cdn.cacheControlHeader` is `'Cache-Control'`; the
      default is `Surrogate-Control`. Then find the responses marked
      `private()`, `no-store` or bubbling "uncacheable" (item 7).
    - Do: report. `cdn.privateCacheControl: false` restores the 4.x behavior.
      [Private responses](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#private-responses)
24. **`s-maxage` is capped by all sources.** If the page or a merged response
    sets an `s-maxage`, the header gets the lowest lifetime for shared caches of
    all sources. A bubbled "uncacheable" adds `no-store` and sets `s-maxage`
    to 0. Merged headers are parsed with `@tusbar/cache-control` 3.x: a
    `private="Set-Cookie"` makes the page private, `no-cache="…"` becomes
    `no-cache`.
    - Search: `useCDNHeaders` with `sharedMaxAge` or `s-maxage`;
      `mergeFromResponse`; pages that fetch API routes that set `s-maxage`, or
      whose CDN header has `private=` or `no-cache=`.
    - Do: report pages whose `s-maxage` gets lower or that become private.
      [Merging cacheability](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#merging-cacheability)

### API and runtime config

25. **A set API token is required, even with authorization disabled.**
    - Search: `authorization: false` in `nuxt.config`,
      `NUXT_MULTI_CACHE_API_AUTHORIZATION_DISABLED`, and a token in the config
      or `NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN`.
    - Do: report. Callers must send the token, or the token is set to an empty
      string in that environment.
      [Toggle API authorization](https://nuxt-multi-cache.dulnan.net/overview/runtime-config#toggle-api-authorization)
26. **`NUXT_MULTI_CACHE_API_ENABLED=false` disables the API** (404). It was
    ignored.
    - Search: the variable in `.env*` files and deployment config.
    - Do: report if the API is used where the variable is `false`.
27. **Runtime config turns features on and off.** `NUXT_MULTI_CACHE_CDN`,
    `_COMPONENT`, `_DATA` and `_ROUTE` set to `true` enable a feature that has
    `enabled: false` in `nuxt.config`. Before, the feature stayed off. A
    feature is added to the build when its key exists in the module options,
    also with `enabled: false`, so the startup table shows it as "Added in
    Build ✅". `NUXT_MULTI_CACHE_CDN=false` now also turns off the CDN headers:
    before, `useCDNHeaders` and bubbling still sent them.
    - Search: these variables in `.env*` files and deployment config.
    - Do: report each feature that now turns on, and each environment where
      the CDN headers disappear. To keep a feature out of the build entirely,
      remove its key from the module options.
28. **`cacheTagInvalidationDelay: 0` purges during the request.** It was
    replaced by 60000. Now the purge tags API responds once the items are
    removed, with an error response if the storage fails, and
    `cacheTagInvalidator.add()` returns a promise that resolves after the purge.
    Cloudflare presets always use 0: in 4.x, purging by tag never ran there,
    because Workers don't run timers after the response. A set delay logs a
    build warning.
    - Search: `cacheTagInvalidationDelay`, `cacheTagInvalidator`; a
      `cloudflare` Nitro preset in `nuxt.config`, `NITRO_PRESET` or the
      deployment config.
    - Do: report. On Cloudflare, also report caches without a cache tag
      registry: purging by tag fails above about 1,000 items.
      [Cloudflare Workers](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#cloudflare-workers)

### Storage and types

29. **Permanent items get no storage TTL.** Redis, Upstash and Vercel KV
    rejected the old `ttl: -1`, so permanent route and component items were
    never stored; Cloudflare KV expired them after 60 s. Now they stay until
    purged, and items with stale-if-error or stale-while-revalidate stay longer.
    - Search: the storage drivers in the server options.
    - Do: report for a driver with TTL support: the storage grows, so permanent
      items need cache tags to be purged.
      [Expiration](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#expiration)
30. **Type changes.** `useMultiCacheApp()` returns `MultiCacheApp | undefined`;
    `DataCacheItem.data` is `unknown`. The CDN helper is based on
    `@tusbar/cache-control` 3.x instead of 1.x, whose `CacheControl` has the new
    fields `mustUnderstand`, `noCacheFields` and `privateFields`.
    `CacheabilityInterface` has a new `getCacheable()` method: an object without
    it passed to `mergeFromCacheability()` throws.
    - Search: the typecheck output; imports from `@tusbar/cache-control`;
      `mergeFromCacheability(` with an object of the app.
    - Do: add guards and types. Replace types imported from
      `@tusbar/cache-control` for the CDN values with `CDNCacheControl` from
      `nuxt-multi-cache`. Add `getCacheable()` to such objects.

### Code against the module's internals

31. **Patches, mocks and imports of internals break silently.** They target
    the 4.x implementation. In 5.0, for example, the API handlers get the app
    with `getMultiCacheApp()`, which responds with a 500 if it's missing, and
    `checkAuth` reads `config.api.enabled`. `useCDNHeaders(cb, event)` does
    nothing for an event without `context.multiCacheApp.config.cdn`, which the
    module's `request` hook sets, e.g. a fake event in a unit test. The
    `x-nuxt-multi-cache-request` header is removed from requests, so handlers
    no longer see it. A test that mocks the old shape can fail, or pass by
    accident.
    - Search: `patchedDependencies` in `package.json` or `pnpm-workspace.yaml`,
      and patch files for `nuxt-multi-cache` in `patches/` or `.yarn/patches/`;
      imports from `nuxt-multi-cache/dist/`; mocks of `#nuxt-multi-cache/*` or
      of `useNitroApp().multiCache`; properties that start with `_`, such as
      `cdn._control`.
    - Do: remove patches for bugs that 5.x fixes, and recreate the others
      against 5.x. Adapt mocks to the 5.x code and check that the tests using
      them fail when the tested behavior breaks. Replace reads of `cdn._control`
      with `cdn.getControl()`, which returns the values sent in the header:
      `_control.sharedMaxAge` now only holds the app's own value, not the
      computed `s-maxage`. Report other uses of private properties.

### Nuxt layers

32. **A server options file in a layer is used.** 4.x only read the app's
    `server/multiCache.serverOptions.ts`. Now the first file found is used,
    starting with the app, then its layers in their order of priority. The
    files aren't merged.
    - Search: `multiCache.serverOptions` in the layers of the app: the
      `layers/` folder, and the paths and packages in `extends` of
      `nuxt.config`, also in `node_modules`.
    - Do: report if a layer has the file and the app doesn't: its storage
      drivers, `cacheKeyPrefix`, `enabledForRequest` and other options now
      apply. If the app has its own file, nothing changes.
      [Nuxt layers](https://nuxt-multi-cache.dulnan.net/overview/server-options#nuxt-layers)

### Logging

33. **The module's server logs appear.** In 4.x, its runtime logger printed
    nothing. Now storage and purge errors are logged, and with `debug: true`
    one line per cache operation. Errors of a delayed tag purge are logged
    instead of reaching Nitro's `error` hook. The warning
    `Unexpected error in nuxt-multi-cache nitro error handler.` is now
    `Unexpected error in nuxt-multi-cache error handler.`
    `NUXT_MULTI_CACHE_DEBUG` never had an effect; `debug` is a module option.
    - Search: `debug: true` in the module options, `NUXT_MULTI_CACHE_DEBUG`,
      log filters or alerts that match `nuxt-multi-cache`.
    - Do: report. Set `debug` only where the log volume is acceptable.

## Report

1. A table with one row per checklist item: number, change, verdict, evidence,
   and what you changed.
2. **For you to decide:** each reported item with the affected places and the
   proposed change.
3. **Outside the repo**, the items that depend on the deployment, and always:
   - **Purge all caches after deploying** (`POST /__nuxt_multi_cache/purge/all`,
     or the configured `api.prefix`). Keys changed, and items stored by 4.x may
     have a wrong expiry, the internal headers of API routes, the modules of
     other components, or the markup of request-specific nested components.
   - **Environment variables** of the deployment for items 25 to 27 and 33, if
     they aren't in the repo.
   - **Log alerts and log volume** (item 33).
