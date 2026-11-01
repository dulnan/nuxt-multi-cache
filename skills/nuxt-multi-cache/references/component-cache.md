# Component cache

`<RenderCacheable>` renders its slot once, stores the markup, and returns it for
every request with the same key. The component's code doesn't run on a cache
hit. [Docs](https://nuxt-multi-cache.dulnan.net/features/component-cache)

## The slot

- One component as the only child. Further children would be stored with it
  under its key, which doesn't cover their props. Put a `v-if` on
  `<RenderCacheable>`, not on the component.
- The component needs a name: its `name` option or the file name of its SFC.
  Without one, it's rendered without cache.

## The key

- **Generated:** the component's name and a hash of its props
  (`Navbar::Ylz5VOw...`). Everything the markup depends on has to be a prop.
- **Slot content** isn't part of the generated key. A child with content
  between its tags is only cached with a `cache-key`.
- **`cache-key`** replaces the generated key, so it has to cover the props and
  every variant of the slot content, e.g. `:cache-key="'info--' + locale"`. An
  empty `cache-key` uses one entry for all instances.
- **A wrapper component** that forwards its own `<slot />` into
  `<RenderCacheable>` is only cached with a `cache-key`, which has to cover
  everything callers pass into the slot.
- A key with a `?` isn't cached.

## Inside the component

- Read the route, cookies, request headers, `useState` and stores in the parent
  and pass the values as props. Inside, they are read once and frozen in the
  markup. `useHead` calls and changes to global state happen only on the render
  that is stored.
- Data loaded with `useAsyncData` or `useFetch` needs its keys in
  `async-data-keys`, so the payload is stored with the markup and hydration
  gets it on a cache hit.
- `useComponentCache((helper) => ...)` sets the max age, cache tags or
  `setUncacheable()` from inside the component.

## Cacheability

- Props: `max-age`, `stale-if-error`, `cache-tags`, `no-cache`, and
  `bubble-cacheability` to merge into the page's route cache and CDN headers.
- `no-cache` only skips the component cache, and an enclosing
  `<RenderCacheable>` isn't cached either. It doesn't change the page: for
  user-specific content, also call `setUncacheable()` on the route and
  `cdn.private()`, or call `setUncacheable()` through `useComponentCache`
  inside the component with `bubble-cacheability` set.
- **Nested instances** always merge into the outer one: an uncacheable inner
  instance makes the outer one uncacheable, and the lowest max age and all tags
  win. On a hit of the outer instance, the inner ones don't render, so the outer
  key has to vary with everything the inner content depends on.
- Data cache items inside the slot bubble only to the route cache and CDN
  headers, not to the enclosing `<RenderCacheable>`. Set the outer instance's
  `max-age` and `cache-tags` for that data yourself.

## Review

For each `<RenderCacheable>`, answer:

1. Does the markup depend on anything that is neither a prop nor part of the
   `cache-key`: the route, the user, cookies, the language, global state?
2. Does the child get slot content, or is the slot forwarded? Then does the
   `cache-key` cover every variant of it?
3. Does the component load data? Then are its keys in `async-data-keys`, and do
   the cache tags name the data's source?
4. Is it nested in or around another `<RenderCacheable>`, and does the outer key
   still vary with the inner content?

Done when every instance has an answer to all four, and every "yes" to the
first question is fixed with a prop, a `cache-key`, or `no-cache` together with
an uncacheable page.
