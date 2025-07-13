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

- `'next-hour'` - Will cache until the end of the current hour (e.g. if the
  current time is `11:30:00`, it will calculate a max age of `1799`, so the item
  invalidates at exactly `11:59:59`)
- `'midnight'` - Will cache until midnight of the current day (e.g. `23:59:59`)

## Special Strings

There are also two special strings that can be used:

- `'permanent'` - Will cache without a max age. This is equal to setting no max
  age.
- `'never'` - Will not cache at all.

## Special Numbers

The following two numbers have a "special" (but intuitive) meaning:

- `-1` - Will cache without a max age. This is equal to setting `'permanent'` or
  setting no max age at all.
- `0` - Will not cache at all. Equal to setting `'never'`.

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
