---
title: Data
position: 120
category: 'Caches'
features:
  - "API responses"
  - "Result of complex calculations or array mappings"
  - "Promises"
---

<p className="lead">
The data cache is the 'fallback' cache for anything that can be persisted
across multiple requests:
</p>

<list :items="features"></list>

## Config

Enable the data cache module:

```javascript
module.exports = {
  multiCache: {
    dataCache: {
      enabled: true
    },
  }
}
```

## Caching data

Use the `context.app.$cache.data.set()` method to store anything in the cache:

```javascript
this.$cache.data.set('my_key', data)
```

You can then access cached data using the `context.app.$cache.data.get()`
method:

```javascript
const cached = this.$cache.data.get('my_key')
```

You will receive exactly the same object as you passed in. There is no
(de)serialization. This means you can also cache a Promise:

```javascript
function getMenu() {
  const cached = this.$cache.data.get('cached_menu')

  if (cached) {
    return Promise.resolve(cached)
  }

  const promise = this.$api.fetch('menu')
  this.$cache.data.set('cached_menu', promise)

  return promise
}

getMenu().then(menu => {
  // Do stuff.
})
```

## Using cache tags

Like all caches, the data cache also allows you to add cache tags:

```javascript
this.$cache.data.set('my_key', links, ['link:123', 'link:420', 'link:593'])
```

The cache entry will now be removed whenever one of the three tags is
invalidated.
