---
title: TypeScript support
description: Fully compatible with TypeScript projects.
position: 3
category: 'Getting started'
---

<p className="lead">
nuxt-multi-cache is written entirely in TypeScript and exports various types,
interfaces and enums.
</p>

### nuxt.config.ts

```typescript
import { MultiCacheConfig, PageCacheMode } from 'nuxt-multi-cache'

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
