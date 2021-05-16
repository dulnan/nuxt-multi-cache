---
title: Installation
position: 1
category: 'Getting started'
---

```bash
npm install --save nuxt-multi-cache
```

In `nuxt.config.js`:

```javascript
module.exports = {
  modules: ['nuxt-multi-cache'],

  multiCache: {
    enabled: true,
    outputDir: '~/cache',
    serverAuth: {
      username: 'admin',
      password: 'hunter2'
    },
    pageCache: {
      enabled: true
    },
    dataCache: {
      enabled: true
    }
  }
}
```
