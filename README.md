# Nuxt Route Cache

Caches pages based on the route and purge a cached page.

# Concepts
- In-memory page cache using routes as the key.
- Possibility to exclude requests from hitting the cache
- Optional cache tags per route.
- Endpoints to purge everything, one or more routes or tags.

# Warning
Caching is hard. You should be aware of the risks and potentially huge security
issues that may arise when caching an entire page.

Always make sure to never cache anything with content restricted to
authenticated users. Else you may leak sensitive information to anonymous
users.

# Data cache
The data cache is a cache for anything: Fetch responses, objects, arrays,
strings or even promises.

## Usage

You can use it anywhere for anything. Cache entries are referenced using an
unique key:

```javascript
this.$cache.data.set('my_key', data, ['tag:1', 'tag:2'])
const result = this.$cache.data.get('my_key')
```

Cache tags are optional, but they are required if you want to purge caches by
tags.

## Example: nuxtServerInit
One good use case for the data cache is nuxtServerInit.
This special store action is called by Nuxt for every request, to prepare the
store for further rendering.
The problem is that this is blocking and in most cases the state is exactly the
same across all requets. Therefore it's a good candidate for caching.

Let's say you have to perform an API request to fetch store data:

```javascript
nuxtServerInit({ commit }) {
  return this.$api.get('init').then(data => {
    commit('setMenu', data.menu)
    commit('setFooter', data.footer)
    commit('setSettings', data.settings)
  })
}
```

This works all well, but what if you're hit by 10 requests at once, for example
from a crawler? This will create 10 API calls that all fetch the same.

One solution to this would be to cache the response of the API call:

```javascript
nuxtServerInit({ commit }) {
  const fetchInit = () => {
    const cached = this.$cache.data.get('init')
    if (cached) {
      return Promise.resolve(cached)
    }

    return this.$api.get('init').then(data => {
      this.$cache.data.set('init', data)
      return data
    })
  }

  return fetchInit().then(data => {
    commit('setMenu', data.menu)
    commit('setFooter', data.footer)
    commit('setSettings', data.settings)
  })
}
```

Now once the API call is done, it is cached and any further requets will get
the cached response.

There is still one problem here: Initially, all 10 requests will get a cache
miss and perform 10 API calls. But there is an easy way to solve that:

```javascript
nuxtServerInit({ commit }) {
  const fetchInit = () => {
    const cached = this.$cache.data.get('init')
    if (cached) {
      return cached
    }

    const promise = this.$api.get('init')
    this.$cache.data.set('init', promise)
    return promise
  }

  return fetchInit().then(data => {
    commit('setMenu', data.menu)
    commit('setFooter', data.footer)
    commit('setSettings', data.settings)
  })
}
```

Now, when 10 or 100 requests arrive at the same time, only the first will
actually perform the API call and immediately cache the promise. Any
requests after that will receive the promise and wait until it is resolved.
From then on, the nuxtServerInit function should finish in just a few
milliseconds.

# Component cache

This module extends the component caching functionality of
vue-server-renderer by providing a way to purge cached components based on
cache tags or key.

When you enable this feature, component caching is enabled using a special
cache backend that handles cache tags and purging.

## Making a component cacheable

Using the regular way of vue-server-renderer:

```javascript
export default {
  props: {
    name: String
  },
  serverCacheKey(props) {
    return props.name
  }
}
```

Now the component is cached and it's using the `name` prop as the key. That
means if the name changes, it will create a different cache entry.

## Adding cache tags to a cacheable component

In order to use the builtin functionality, you can build a special key that
contains cache tags, which are extracted before the cache entry is written:

```javascript
export default {
  props: {
    name: String
  },
  serverCacheKey(props) {
    return props.name + '____tag:1$tag:2$tag:3'
  }
}
```

This will cache the component with `name` as the key and make it purgable using
any of the three tags.

You can use a helper method that builds the key for you:

```javascript
import { getServerCacheKey } from 'nuxt-cache'

export default {
  props: {
    name: String,
    cacheTags: Array
  },
  serverCacheKey(props) {
    return getServerCacheKey(props.name, ['tag:1', ...props.cacheTags])
  }
}
```

# Page cache

This cache is kind of a hybrid between a statically generated and a SSR site.
In essence, this feature will cache a route on disk, as a HTML file, with the
full URL path converted to the path on disk:

`/en/products/my-foobar-product-2` becomes `/en/products/my-foobar-product-2-html`

The feature itself does not serve the HTML files, it only writes them. The idea
is to use Apache, nginx or any other web server to first try to serve from the
directory containing the cached pages. If that results in a 404, the request is
proxy passed to Nuxt, which will then render the page and write it to disk, so
that the next request will be served directly by the web server.

So basically, it's statically generated on demand.

# Cache groups

Cache groups provide a way to cache multiple things using a single cache tag.

## Example: Navigation

In this scenario we have a Navbar.vue component, that gets its data from the
store. The menu links are fetched using an API call in nuxtServerInit. This API
call also returns 80 cache tags, one for every menu link, for example.

You want to cache the API call, the Navbar component and also the entire page.
All three cache entries should be purged whenever 1 of the 80 tags is purged.

You don't want to pass around 80 tags in three different places, so cache
groups provide a simple way to avoid that.

### store/index.js
```javascript
nuxtServerInit({ commit }) {
  const fetchMenu = () => {
    const cached = this.$cache.data.get('menu')
    if (cached) {
      return cached
    }

    const promise = this.$api.get('menu').then(data => {
      // Create a group named 'group_menu'.
      this.$cache.groups.add('group_menu', data.cacheTags)
      return data
    })
    this.$cache.data.set('init', promise)
    return promise
  }

  return fetchInit().then(data => {
    commit('setMenu', data.menu)
    commit('setFooter', data.footer)
    commit('setSettings', data.settings)
  })
}
```

Now that the group `group_menu` is created, you can use this like a regular
cache tag.

### components/Navbar.vue

```javascript
import { getServerCacheKey } from 'nuxt-cache'

export default {
  serverCacheKey() {
    return getServerCacheKey('default', ['group_menu'])
  }
}
```

### layouts/default.vue

```vue
<template>
  <div>
    <navbar />
    <nuxt />
  </div>
</template>

<script>
export default {
  created() {
    if (process.server) {
      // Because we render the Navbar component, we add its cache tag for the
      // route.
      this.$cache.route.addTags(['group_menu'])
    }
  }
}
</script>
```

## Purgin a cache group

Any cache entry with a cache group tag can be purged by either purging the
cache group name or any of the tags belonging to the group.

# Setup
```javascript
module.exports = {
  modules: ['nuxt-route-cache'],

  routeCache: {
    /**
     * Enable caching globally.
     */
    enabled: process.env.NODE_ENV !== 'development',

    /**
     * Logs debug messages.
     */
    debug: process.env.NODE_ENV === 'development',

    /**
     * Provide a secret used to authenticate against the purge endpoints.
     */
    secret: 'foobar',

    /**
     * Custom method to check if a request is allowed to purge the cache
     * instead of using a secret.
     */
    purgeAuthCheck: function(req) {
      // Only allows purging from this IP address.
      return req.ip === '192.168.1.100'
    },

    /**
     * Enable or disable caching for a request.
     */
    enabledForRequest: function(req, route) {
      // Disable caching for logged in users.
      return !isLoggedIn(req.header('cookie'))
    },

    /**
     * Create a custom cache key.
     *
     * Returning a falsey value will prevent the route from being cached.
     * Warning: Make sure that the returned key is unique! If your function
     * returns the same key for routes with different content, subsequent
     * requests will receive the first cached route.
     */
    getCacheKey: function(route, req) {
      // Use only one part of the route as the cache key.
      // Example: /content-page-123
      // Key: 123
      return (route.match(/(\d.*)$/) || [])[0]
    }
  }
}
```

## Usage
Nothing is cached by default, so you have to mark a page as cacheable. Use
the provided `$routeCache` plugin, accessible from the Nuxt context, to do that.

You can call any of the methods from anywhere, as long as it happens during
SSR.

Be aware of the order in which Nuxt renders a route. It's probably a good idea
to set cacheability in just a single place, ideally in asyncData.

### setCacheable() - Enabling cache for a route
```javascript
asyncData({ app }) {
  return app.$api.get('/products').then(products => {
    app.routeCache.setCacheable()
    return products
  })
}
```

### setTags() - Setting cache tags

In this example of a product detail page we add a cache tag based on the
product ID:
```javascript
asyncData({ app, route }) {
  const id = route.params.id
  return app.$api.get('/products/' + id).then(product => {
    app.$routeCache.setCacheable()
    app.$routeCache.setTags(['product:' + id])
    return product
  })
}
```
You can also add additional tags in child components of a page component.
One use case might be a product list component which has its own API call
inside fetch(). You may want to add a cache tag for every product in the list.


### setUncacheable() - Marking uncacheable
It's also possible to mark a route as uncacheable, if it previously was set to
cacheable.

```javascript
asyncData({ app, route }) {
  const id = route.params.id
  return app.$api.get('/products/' + id).then(product => {
    app.$routeCache.setCacheable()
    app.$routeCache.setTags(['product:' + id])
    return product
  })
}

...

mounted() {
  if (this.hasError) {
    this.$routeCache.setUncacheable()
  }
}
```
You can use this for example if you want to reverse the cacheability if there
were errors while rendering the page. Don't use this to prevent caching of
sensitive information! Provide a custom enabledForRequest method that checks if
the user is logged in or not, to prevent any such request from being cached
entirely or receiving a cached page.


# Purging

It is possible to purge the entire cache, single cache entries by key or by tag.
Multiple values should be separated by double pipes ("||").

When purging you need to send the same secret as set in the module config.
Otherwise it will return a 403 error.
You can either send it as an HTTP header `x-nuxt-cache-secret` or as a query
parameter `secret`.

If you provided a custom purgeAuthCheck method, you don't need to send a
secret.

## /__route_cache/purge_routes - Purge one or more routes

```bash
curl -X POST -i -H "x-nuxt-cache-secret: foobar" -H "x-nuxt-cache-purge-routes: /" http://localhost:3000/__route_cache/purge_routes
curl -X POST -i -H "x-nuxt-cache-secret: foobar" -H "x-nuxt-cache-purge-routes: /products/new||/contact/form?key=value" http://localhost:3000/__route_cache/purge_routes
```


## /__route_cache/purge_tags - Purge one or more tags

```bash
curl -X POST -i -H "x-nuxt-cache-secret: foobar" -H "x-nuxt-cache-purge-tags: product:4" http://localhost:3000/__route_cache/purge_tags
curl -X POST -i -H "x-nuxt-cache-secret: foobar" -H "x-nuxt-cache-purge-tags: product:4||media:32" http://localhost:3000/__route_cache/purge_tags
```

## /__route_cache/purge_all - Purge everything

```bash
curl -X POST -i -H "x-nuxt-cache-secret: foobar" http://localhost:3000/__route_cache/purge_all
```

# /__route_cache/stats - Debugging
For debug purposes you can use the /stats endpoint to retrieve information
about which routes are currently in the cache and the cache tags they use.

```bash
curl -X GET -i -H "x-nuxt-cache-secret: foobar"  http://localhost:3000/__ssr_cache/stats
```

