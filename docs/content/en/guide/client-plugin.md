---
title: Plugin
description: Use the client helper plugin to interact with the caches.
position: 30
category: 'API'
---

<p className="lead">
nuxt-multi-cache provides a globally available plugin to interact with the
caches.
</p>

All methods listed here are always available, even if the cache is disabled.

Because caching is only available in SSR, the client version of the plugin
implements no-op methods that always return successfully and don't throw an
error.

## Usage

**Interface:** [CachePlugin](https://github.com/dulnan/nuxt-multi-cache/blob/main/src/Plugin/cache.server.ts)

### asyncData
```javascript
asyncData({ app }) {
  app.$cache.data.get()
}
```

### nuxtServerInit
```javascript
nuxtServerInit({ commit }) {
  this.$cache.data.get()
}
```

### components / fetch
```javascript
fetch() {
  this.$cache.data.get()
}
```

### middleware
```javascript
export default (ctx) {
  ctx.app.$cache.data.get()
}
```


## Properties

### `page`

Any actions performed with these methods are only persisted once the page has
rendered successfully and is deemed cacheable.

| Name | Type |
| :------ | :------ |
| `addTags` | (`tags`: *string*[]) => *void* |
| `setCacheable` | () => *void* |
| `setUncacheable` | () => *void* |

___

### `data`

These methods directly interact with the data cache instance. This means that
multiple requests running in parallel all interact with the same cache.

| Name | Type |
| :------ | :------ |
| `get` | (`key`: *string*) => *any* |
| `set` | (`key`: *string*, `data`: *any*, `tags`: *string*[]) => *void* |


### `groups`

Adding a cache group is performed immediately, e.g. it's directly persisted in
the underlying storage.

| Name | Type |
| :------ | :------ |
| `add` | (`name`: *string*, `tags`: *string*[]) => *void* |
