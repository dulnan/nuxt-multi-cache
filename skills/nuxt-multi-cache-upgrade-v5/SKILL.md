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
3. **Install** `nuxt-multi-cache@^5` with the project's package manager.
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
   permanently.
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
   served. An invalid string now throws on the client.
   - Search: `clientMaxAge`.
   - Do: replace an invalid string with the number of seconds it means (`'3h'` →
     `10800`). Report the others: they now cache on the client.
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
    receives slot content is no longer cached without `cache-key`.
    - Search: every `<RenderCacheable>`; check whether its child has content
      between its tags.
    - Do: report. Propose a `cache-key` only for slot content that is the same
      for every request, unique for each distinct content. Content that differs
      per request (user data, query values) has to be part of the key.
      [Slot content](https://nuxt-multi-cache.dulnan.net/features/component-cache#slot-content)
11. **A forwarded slot with a `cache-key` is cached.** A wrapper component that
    passes its own slot into `<RenderCacheable>` was never cached. With a
    `cache-key`, it now is.
    - Search: components with a `<slot` inside `<RenderCacheable>`.
    - Do: report each wrapper whose `cache-key` doesn't cover everything passed
      into its slot: it now serves the first render to everyone.
      [Wrapper components](https://nuxt-multi-cache.dulnan.net/features/component-cache#wrapper-components)
12. **Nested `<RenderCacheable>` instances merge into the outer one.** An inner
    `no-cache` or uncacheable instance makes the outer one uncacheable, and the
    inner max age and cache tags apply to the outer item.
    - Search: `<RenderCacheable>` inside the content of another, also through
      child components.
    - Do: report outer instances that are no longer cached or expire earlier.
      [Nesting](https://nuxt-multi-cache.dulnan.net/features/component-cache#nesting)

### Route cache

13. **Only GET and HEAD requests use the route cache.**
    - Search: `useRouteCache` in server routes for other methods (`.post.ts`,
      `.put.ts`, method checks in the handler).
    - Do: report.
14. **A stale route is only served for server errors** (5xx and unhandled
    errors). A 404 no longer serves the stale copy.
    - Search: `setStaleIfError`, `staleIfError`; error handling that throws a
      4xx when a backend fails.
    - Do: report. Backend failures need a 5xx status to serve the stale copy.
      [Stale if error](https://nuxt-multi-cache.dulnan.net/overview/stale-if-error#route-cache)
15. **`route.applies` gets the decoded path**, and static files are detected
    without the query string. Paths excluded by `applies` skip the route cache
    entirely, including `enabledForRequest`.
    - Search: `applies` in the server options.
    - Do: match decoded characters (`é` instead of `%C3%A9`). Report a check
      that relied on the query string.
      [applies](https://nuxt-multi-cache.dulnan.net/overview/server-options#applies)
16. **`state.keysBeingRevalidated` is a `Map`** of start times instead of a
    `Set`.
    - Search: `keysBeingRevalidated`.
    - Do: adapt the code; `has()` and `delete()` still work.

### Cache keys and purging

17. **Keys with a `?` are neither read nor stored.** The storage dropped
    everything after the `?`, so different keys shared one item. Affects
    `buildCacheKey`, data cache keys and `cache-key` props built from query
    values or URLs.
    - Search: `buildCacheKey`, and keys of `useDataCache(`,
      `useDataCacheCallback(`, `useCachedAsyncData(` and `cache-key` that
      include a query string or URL.
    - Do: build the key without a `?`, e.g.
      `` `${path}:${encodeURIComponent(query)}` ``.
      [Cache keys](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#cache-keys)
18. **A `cacheKeyPrefix` method that returns no prefix gets `{none}`.** Keys of
    such requests are now `{none}--<key>`.
    - Search: `cacheKeyPrefix` in the server options.
    - Do: report if the method can return `''` or no string. Existing items of
      these requests are missed once.
      [Dynamic prefix](https://nuxt-multi-cache.dulnan.net/overview/server-options#dynamic)
19. **Purging and inspecting by key use new keys** for the cases of item 18 and
    for the root path, which is stored as `{root}`.
    - Search: calls of the purge and inspect API (`/__nuxt_multi_cache/` or the
      configured `api.prefix`) in scripts, CMS hooks and CI.
    - Do: use `{none}--<key>` and `{root}` (with a prefix: `<prefix>--{root}`).
      [Cache key for routes](https://nuxt-multi-cache.dulnan.net/features/route-cache#cache-key-for-routes)

### CDN headers

20. **`Cache-Control` gets `private` when the CDN header is `private` or
    `no-store`.** Fastly ignores both in `Surrogate-Control`. `public` is
    removed from an existing `Cache-Control`, other directives stay.
    - Search: `cdn` options with a `cacheControlHeader` other than
      `Cache-Control`; responses marked `private()`, `no-store` or bubbling
      "uncacheable" (item 7).
    - Do: report. `cdn.privateCacheControl: false` restores the 4.x behavior.
      [Private responses](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#private-responses)
21. **`s-maxage` is capped by all sources.** If the page or a merged response
    sets an `s-maxage`, the header gets the lowest lifetime for shared caches of
    all sources. A bubbled "uncacheable" adds `no-store` and sets `s-maxage`
    to 0.
    - Search: `useCDNHeaders` with `sharedMaxAge` or `s-maxage`;
      `mergeFromResponse`; pages that fetch API routes that set `s-maxage`.
    - Do: report pages whose `s-maxage` gets lower.
      [Merging cacheability](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#merging-cacheability)

### API and runtime config

22. **A set API token is required, even with authorization disabled.**
    - Search: `authorization: false` in `nuxt.config`,
      `NUXT_MULTI_CACHE_API_AUTHORIZATION_DISABLED`, and a token in the config
      or `NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN`.
    - Do: report. Callers must send the token, or the token is set to an empty
      string in that environment.
      [Toggle API authorization](https://nuxt-multi-cache.dulnan.net/overview/runtime-config#toggle-api-authorization)
23. **`NUXT_MULTI_CACHE_API_ENABLED=false` disables the API** (404). It was
    ignored.
    - Search: the variable in `.env*` files and deployment config.
    - Do: report if the API is used where the variable is `false`.
24. **Runtime config can enable a feature** that has `enabled: false` in
    `nuxt.config`: `NUXT_MULTI_CACHE_CDN`, `_COMPONENT`, `_DATA` and `_ROUTE`
    set to `true`. Before, the feature stayed off.
    - Search: these variables in `.env*` files and deployment config.
    - Do: report each feature that now turns on.
25. **`cacheTagInvalidationDelay: 0` purges right away.** It was replaced
    by 60000.
    - Search: `cacheTagInvalidationDelay`.
    - Do: report.

### Storage and types

26. **Permanent items get no storage TTL.** Redis, Upstash and Vercel KV
    rejected the old `ttl: -1`, so permanent route and component items were
    never stored; Cloudflare KV expired them after 60 s. Now they stay until
    purged, and items with stale-if-error or stale-while-revalidate stay longer.
    - Search: the storage drivers in the server options.
    - Do: report for a driver with TTL support: the storage grows, so permanent
      items need cache tags to be purged.
      [Expiration](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#expiration)
27. **Type changes.** `useMultiCacheApp()` returns `MultiCacheApp | undefined`;
    the stats and inspect API responses of the component cache are strings;
    `DataCacheItem.data` is `unknown`.
    - Search: the typecheck output.
    - Do: add guards and types.

## Report

1. A table with one row per checklist item: number, change, verdict, evidence,
   and what you changed.
2. **For you to decide:** each reported item with the affected places and the
   proposed change.
3. **Outside the repo**, the items that depend on the deployment, and always:
   - **Purge all caches after deploying** (`POST /__nuxt_multi_cache/purge/all`,
     or the configured `api.prefix`). Keys changed, and items stored by 4.x may
     have a wrong expiry, the internal headers of API routes, or the modules of
     other components.
   - **Environment variables** of the deployment for items 22 to 24, if they
     aren't in the repo.
