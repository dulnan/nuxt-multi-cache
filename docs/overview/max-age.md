# Max Age

All caches support setting a _max age_ for cache items. This can either be an
absolute value like `60` or relative like `'midnight'`. Once the max age
expires, the cache item will be revalidated.

## Numeric Absolute Duration

An absolute value is just a number in seconds, e.g. `120` meaning 2 minutes. The
cached item will expire in exactly 120 seconds, starting at the time where the
request happened.

## Named Absolute Duration

For better readability in code, you can also use any of the named absolute
durations defined in [type.NamedDurations], for example:

- `'5m'` - Cache for 5 minutes
- `'1h'` - Cache for 1 hour
- `'12h'` - Cache for half a day
- `'2d'` - Cache for 2 days
- `'7d'` - Cache for a week

## Named Relative Interval

You can also use any of the _named intervals_ defined in [type.NamedInterval].
These will automatically calculate the correct max age, for example:

- `'next-quarter-hour'` - Will cache until the next quarter hour (e.g. if the
  current time is `11:20:00`, the item expires at `11:30:00`)
- `'next-hour'` - Will cache until the next full hour (e.g. if the current time
  is `11:30:00`, it will calculate a max age of `1800`, so the item expires at
  exactly `12:00:00`)
- `'midnight'` - Will cache until midnight (`00:00:00` of the next day)
- `'end-of-week'` - Will cache until the end of the week (midnight from Sunday
  to Monday)

The intervals are calculated in the time zone of the server.

## Special Strings

There are also two special strings that can be used:

- `'permanent'` - Will cache without a max age. This is equal to setting no max
  age.
- `'never'` - Is never served from cache as a fresh item. See
  [Max Age 0](#max-age-0).

## Special Numbers

The following two numbers have a "special" (but intuitive) meaning:

- `-1` - Will cache without a max age. This is equal to setting `'permanent'` or
  setting no max age at all.
- `0` - Equal to setting `'never'`. See [Max Age 0](#max-age-0).

Any other negative number, for example a max age calculated from a date that is
already in the past, is treated like `0`.

## Max Age 0

An item with a max age of `0` (or `'never'`) is never served from cache as a
fresh item:

- Without a stale period, it isn't stored at all.
- With a [stale if error](/overview/stale-if-error) duration, a stale copy is
  stored, which is only served if an error happens. This applies to all three
  caches.
- For routes that
  [allow stale while revalidate](/composables/useRouteCache#allowstalewhilerevalidate),
  the response is stored and served to requests that arrive while another
  request renders the route again.

::: warning

A max age of `0` doesn't keep a response out of the cache. If it contains data
specific to the request, such as user data or tokens, mark it as uncacheable
instead, for example with `setUncacheable()` in
[useRouteCache](/composables/useRouteCache#setuncacheable),
[useComponentCache](/composables/useComponentCache#setuncacheable) or the helper
of [useDataCacheCallback](/composables/useDataCacheCallback). Uncacheable items
are never stored, and when their cacheability
[bubbles](/overview/bubble-cacheability), the route becomes uncacheable as well.

:::

## Setting the Max Age Multiple Times

When the max age is set several times, for example by a page and by a component
it renders, the lowest value wins. `'permanent'` counts as the highest value, so
it never replaces a lower max age.

## Calculating the Expires Time

The module uses a single timestamp to calculate the exact time a cache item will
expire. The timestamp is determined the first time any interaction with a cache
happens during a request and is then stored in the event context.

Internally, all values that deal with _time_ are kept as either _seconds_ (for
anything that has an _age_) or as a unix timestamp in seconds (for anything that
is a specific point in time).

So for example, you set the _max age_ as a value in seconds, but internally the
cache item will have a `expires` property that represents an exact timestamp at
which point the item must be revalidated.
