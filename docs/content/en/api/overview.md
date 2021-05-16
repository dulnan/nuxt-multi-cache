---
title: Overview
position: 100
category: 'REST API'
---

nuxt-multi-cache exposes a simple REST API to handle cache invalidation or
fetch the state of all caches.

## Configuration

```javascript
module.exports = {
  multiCache: {
    server: {
      auth: {
        username: 'admin',
        password: 'hunter2'
      },
      namespace: '/__nuxt_multi_cache'
    },
  }
}
```



## Resource

The defa
