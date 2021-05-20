---
title: Overview
description: The API provides stats and methods to purge caches.
position: 200
category: 'REST API'
---

<p className="lead">
nuxt-multi-cache exposes a simple REST API to handle cache invalidation or
fetch the state of all caches.
</p>

## Configuration

```javascript
module.exports = {
  multiCache: {
    server: {
      auth: {
        username: 'admin',
        password: 'hunter2'
      },
      path: '/__nuxt_multi_cache'
    },
  }
}
```

## Resource

The API is attached as a Nuxt [serverMiddleware](https://nuxtjs.org/docs/2.x/configuration-glossary/configuration-servermiddleware/).
The default path is `/__nuxt_multi_cache`, but you can change that using the
`server.path` configuration.

## Cache specific endpoints

Note that all cache specific endpoints listed here are only available if you
actually enabled the cache.

## Basic authentication

The API endpoints are protected using HTTP Basic Auth. You can specify the
username and password in the `server.auth` configuration.

<code-group>
<code-block label="cURL" active>

```bash
curl -X GET -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  http://localhost:3000/__nuxt_multi_cache/stats/tags
```
</code-block>

<code-block label="node-fetch">

```javascript
import base64 from 'base-64'

const headers = new Headers({
  Authorization: `Basic ${base64.encode('admin:hunter2')}`
})
fetch('http://localhost:3000/__nuxt_multi_cache/stats/tags', { headers })

```

</code-block>

</code-group>

## Custom authentication

Alternatively, you can provide a custom function to perform the authentication.
It receives the express [Request](http://expressjs.com/en/api.html#req) as a
parameter and you should return `true` if the request is authorized.

```javascript
module.exports = {
  multiCache: {
    server: {
      auth(req) {
        return isLoggedIn(req.header('Authentication'))
      }
    },
  }
}
```
