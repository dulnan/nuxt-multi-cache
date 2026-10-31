# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

nuxt-multi-cache is a Nuxt module (Nuxt `^4`) with a component cache, route
cache, data cache, CDN cache-control headers and a cache management API. The
documentation site (VitePress) lives in `docs/`, the dev app in `playground/` (a
second one using the filesystem driver in `playground-disk/`).

## Commands

```sh
npm run dev:prepare   # Required after install: stubs the module build and prepares the playgrounds
npm run dev           # Playground dev server
npm run dev:build     # Build the playground (CI runs this before the tests)
npm run format        # oxfmt --check (format:fix to write); also formats Markdown and code blocks in docs/
npm run lint          # oxlint
npm run typecheck     # vue-tsc for the root (includes test/), playground and playground-disk
npm run prepack       # Full module build into dist/
npm run docs:build    # Build the docs (fails on dead internal links)
npm test              # Vitest (watch); test:ci runs once
```

- Tests need `TZ=utc` (snapshots depend on it). The npm scripts set it. When
  calling vitest directly:
  `TZ=utc npx vitest run test/path/file.spec.ts -t 'test name'`.
- `npm run prepack` replaces the stubbed `dist/` with a full build, which makes
  `typecheck` fail with conflicting declarations. Restore the stub with
  `npx nuxt-module-build build --stub`.
- CI order: `dev:prepare`, `format`, `lint`, `typecheck`, `prepack`,
  `dev:build`, `test:ci`.

## Tests

Vitest has two projects (`vitest.config.mts`):

- `unit` (node environment): `*.node.spec.ts` and `*.e2e.spec.ts`. The e2e specs
  use `@nuxt/test-utils/e2e` `setup()` to build and serve a Nuxt app, either
  `playground/` or a fixture in `test/cases/<name>/nuxt/`, often with
  `nuxtConfig` overrides for the module options.
- `nuxt` (nuxt environment): `*.nuxt.spec.ts`, e.g. hooks and `RenderCacheable`,
  which mock `#nuxt-multi-cache/config`, `#nuxt-multi-cache/server-options`,
  `nitropack/runtime` and h3 functions as needed.

`test/__helpers__/` reads and purges cache items through the module's API in e2e
tests. Test mode (`enableTestMode`) allows overriding the current time with the
`x-nuxt-multi-cache-date-override` request header.

## Architecture

### Build side (`src/module.ts`, `src/build/`)

- A feature is **added** when its key exists in the module options (its
  composables, server utils and components are registered) and **enabled** via
  `enabled: true`. The enabled flags go into runtime config
  (`multiCache.{cdn,component,data,route,api}`), so they can be toggled at
  runtime. The Nitro plugin is only added if at least one feature (or the API)
  is enabled at build time.
- Templates (`src/build/templates/`) generate `#nuxt-multi-cache/config`
  (build-time constants: debug, header names, which features are added, API
  prefix, test mode) and `#nuxt-multi-cache/server-options`, which bundles the
  user's `server/multiCache.serverOptions.ts` (`defineMultiCacheOptions`).
  Server options hold everything that can't be serialized into `nuxt.config`:
  storage drivers, `bubbleError`,
  `route.buildCacheKey/alterCachedHeaders/applies`, `enabledForRequest`,
  `cacheKeyPrefix`, API authorization callback, cache tag registry.
- A build plugin replaces server-only modules with stubs in client bundles
  (`CLIENT_STUBS`), and calls of `useRouteCache`, `useCDNHeaders` and
  `useComponentCache` are tree-shaken from the client.

### Runtime (`src/runtime/`)

- `server/plugins/multiCache.ts` creates the `MultiCacheApp` (one unstorage
  instance per enabled cache, cache tag registry/invalidator, shared state) and
  registers:
  - the `request` hook: attaches the app and, for cacheable requests (GET/HEAD,
    no ambiguous path like `//x`, not excluded paths, `applies` with the decoded
    path, `enabledForRequest`), a route cache helper to `event.context`;
  - `serveCachedHandler`, unshifted to the front of the h3 stack: serves route
    cache hits;
  - the `afterResponse` hook: stores cacheable responses (status 200, non-empty
    body);
  - the `error` hook: serves a stale route on server errors (stale-if-error).
- Composables (`composables/`, Nuxt, event optional) and server utils
  (`server/utils/`, Nitro, event required) are thin wrappers around the
  implementations in `shared/`.
- `helpers/CacheHelper.ts` is the base of the route, component and data cache
  helpers: max age and stale-if-error only ever get lower, `setUncacheable()` is
  final. `helpers/CDNHelper.ts` manages the CDN headers separately (via
  `@tusbar/cache-control`).
- `helpers/maxAge.ts` defines the max age semantics: `-1`/`'permanent'` = no
  limit (never lowers another value), `0`/`'never'` = don't cache, other
  negatives and `NaN` = never. `getStorageTtl()` decides the unstorage `ttl`
  (`undefined` = no TTL, `CACHE_NEVER` = don't store).
- Storage format (`helpers/cacheItem.ts`): route and component items are strings
  `JSON(metadata)<CACHE_ITEM>body`, data items are objects. Keys are
  `<prefix>--<key>` when a `cacheKeyPrefix` is set; route keys are the pathname
  (query ignored) unless `buildCacheKey` is set, and `/` is stored as `{root}`.
- Bubbling (`helpers/bubbleCacheability.ts`): with the `bubbleCacheability`
  option, data cache items and cached components merge their max age,
  stale-if-error, tags and uncacheability into the route cache helper and/or the
  CDN helper.
- `useCacheAwareFetchInterceptor` marks internal SSR requests with the
  `x-nuxt-multi-cache-request` header. API routes answer them with internal
  headers (route cache tags, expires, stale-if-error expires, uncacheable),
  written by the server `useRouteCache` after each call. They are bubbled into
  the page and stripped before storing (`INTERNAL_RESPONSE_HEADERS`).
- `components/RenderCacheable/server` renders its slot with `ssrRenderSlotInner`
  and stores the markup, the payload of `asyncDataKeys` and the rendered module
  IDs (`ssrModules`, collected through a scoped SSR context provided under Vue's
  `ssrContextKey`). `provide()` calls must happen before the first `await` in
  its setup. The client version only renders the slot.
- `server/api/` contains the purge/stats/inspect handlers, registered only if
  `api.enabled` is set at build time. `checkAuth` responds with 404 when the API
  is disabled via runtime config, then checks the token, disabled authorization,
  or the server options callback.

## Docs

- Behavior changes need matching updates in `docs/`. Pages include source files
  with `<<< @/../src/...`; `[type.Name]` links resolve to type declarations in
  the files listed in `TYPE_FILES` in `docs/.vitepress/config.ts`, and the build
  throws on unknown type names.
- The sidebar is defined in `docs/.vitepress/config.ts`; redirects for removed
  pages go into `docs/public/_redirects`.

## Commits

Conventional commit messages (`fix:`, `feat:`, `docs:`, `test:`, `chore:`,
`refactor:`). Breaking changes get a `BREAKING CHANGE:` footer.
