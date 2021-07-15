---
title: Installation
description: Installing the package and enabling the module
position: 1
category: 'Getting started'
---

```bash
npm install --save nuxt-multi-cache
```

## Minimal configuration

In `nuxt.config.js`:

```javascript
module.exports = {
  modules: ['nuxt-multi-cache'],

  multiCache: {
    enabled: true,
    outputDir: '~/cache',
    server: {
      auth: {
        username: 'admin',
        password: 'hunter2'
      },
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

Note that the `enabled` properties are not overridden by the module, e.g. when
in dev mode. If you want to disable caches during development, set `enabled: false`.
