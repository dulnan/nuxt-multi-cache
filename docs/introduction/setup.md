# Setup

## Step 1: Install

Install the module using your preferred package manager.

```sh
npm install --save nuxt-multi-cache
```

## Step 2: Configure

Add the module to your Nuxt config.

```typescript
// ./nuxt.config.ts
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],
})
```

By default the module does not enable a single feature, you have to manually
define which you'd like to use.

## Step 3: Use features

Each feature works independently of another and is therefore documented separately:

- [Component Cache](/features/componentCache)
- [Route Cache](/features/routeCache)
- [Data Cache](/features/dataCache)
- [CDN Cache Control](/features/cdnCacheControl)
- [Purge API](/features/api)
