---
title: Configuration
position: 20
category: 'API'
---

## componentCache

• `Optional` **componentCache**: *object*

Configuration for the component cache.

### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `enabled` | *boolean* | Enable component caching. |
| `lruOptions?` | *Options*<string, LRUCacheEntry\> | Options passed to the lru cache for components. |

Defined in: config.ts:96

___

## dataCache

• `Optional` **dataCache**: *object*

Configuration for the data cache.

### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `enabled` | *boolean* | - |
| `lruOptions?` | *Options*<string, LRUCacheEntry\> | Options passed to the lru cache for components. |

Defined in: config.ts:111

___

## debug

• `Optional` **debug**: *boolean*

Logs helpful debugging messages to the console.

Defined in: config.ts:25

___

## enabled

• **enabled**: *boolean*

Enable the module globally.

Even if disabled, the module will attach the helper plugin, but won't do
anything besides that.

Defined in: config.ts:20

___

## enabledForRequest

• `Optional` **enabledForRequest**: (`req`: *any*, `route`: *string*) => *boolean*

A method to decide if a request should be considered for caching at all.

The default method returns true for every route.

Returning true does not automatically cache all pages. It's still
required to call app.$cache.route.setCacheable().

Returning false here prevents anything to be cached during this request.
You can use this to prevent sensitive data to be cached and potentially
accessible by anyone.

Calling setCacheable() will not make it cacheable.

### Type declaration

▸ (`req`: *any*, `route`: *string*): *boolean*

### Parameters

| Name | Type |
| :------ | :------ |
| `req` | *any* |
| `route` | *string* |

**Returns:** *boolean*

Defined in: config.ts:91

___

## groupsCache

• `Optional` **groupsCache**: *object*

Configuration for the groups cache.

### Type declaration

| Name | Type |
| :------ | :------ |
| `enabled?` | *boolean* |

Defined in: config.ts:123

___

## outputDir

• **outputDir**: *string*

Folder where cache modules can write state.

Defined in: config.ts:30

___

## pageCache

• `Optional` **pageCache**: *object*

Enable the page cache.

This will save every cached page to the specified location, preserving URL
structure and mapping them to folders and file names. Use this to serve
cached routes directly from Apache, nginx or any web server.

### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `enabled` | *boolean* | Enable page caching. |
| `getCacheKey?` | (`route`: *string*, `context`: Context) => *string* \| *void* | Determine the unique cache key for a route.  This can be used to rewrite how the route is identified in the caching process. For example, if you rely on query parameters for a route, you can rewrite them like this: /search?query=foo%20bar  => /search--query=foo__bar This will allow you to cache routes depending on the query parameter and then serve these from your webserver, if configured properly. |
| `mode` | [*PageCacheMode*](/configuration/enums/pagecachemode.md) | Set the mode for the page cache. |

Defined in: config.ts:39

___

## server

• **server**: *object*

Authenticate a server request.

Provide an object with username and password properties to authenticate
using basic auth.
If you provide a function, you can perform the authentication yourself.
The function receives the request as an argument and should return a
boolean.

### Type declaration

| Name | Type |
| :------ | :------ |
| `auth` | ServerAuthMethod \| ServerAuthCredentials |
| `path?` | *string* |

Defined in: config.ts:72
