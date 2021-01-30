# Nuxt SSR Page Cache

# Concepts
- In-memory page cache using routes as the key.
- Optional cache tags per route.
- Purge everything, one or more routes or tags.

# Warning
Caching is hard. You should be aware of the risks and potentially huge security
issues that may arise when caching an entire page.

Always make sure to never cache anything with content restricted to
authenticated users. Else you may leak sensitive information to anonymous
users.

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
the provided $routeCache plugin, accessible from the Nuxt context, to do that.

You can call any of the methods from anywhere, as long as it happens during
SSR.

Be aware of the order in which Nuxt renders a route. It's probably a good idea
to set cacheability in just a single place, ideally in asyncData.

### setCacheable() - Enabling cache for a route
```javascript
asyncData({ app }) {
  return app.$api.get('/products').then(products => {
    app.$routeCache.setCacheable()
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

It is possible to purge the entire cache or by providing one or more routes/tags.
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

