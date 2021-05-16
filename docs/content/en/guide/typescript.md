---
title: TypeScript
position: 3
category: 'Getting started'
---

nuxt-multi-cache is entirely written in TypeScript and exports various types, interfaces and enums.

### nuxt.config.ts

```typescript
import { CacheConfig, PageCacheMode } from 'nuxt-route-cache'

const multiCache: CacheConfig = {
  enabled: true,
  outputDir: '~/cache',
  serverAuth: {
    username: 'admin',
    password: 'hunter2'
  },
  pageCache: {
    enabled: true,
    mode: PageCacheMode.Memory
  },
  dataCache: {
    enabled: true
  }
}

export default { multiCache }
```
