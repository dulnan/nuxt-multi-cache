---
title: Page
position: 10
category: 'Caches'
---

Using a page cache significantly improves performance of your website, by
caching the entire rendered markup of a page and serving it immediately when a
cached page is requested.

nuxt-multi-cache hooks into the main renderRoute method of Nuxt and will return
cached markup if available. Since this happens very early in the lifecycle, you
can achieve response times below 50ms.

## Config

Enable the page cache module:

```javascript
module.exports = {
  multiCache: {
    pageCache: {
      enabled: true
    },
  }
}
```

## Caching a page

By default nothing is cached. You have to manually mark a page as cacheable:

```javascript
context.app.$cache.page.setCacheable()
```

This method can be called anywhere, it's not limited to a page component. It
just needs to be called during server-side rendering.

After the first render, the markup is now cached and served when requesting the
same page a second time.

## Prevent caching

You can bail out from caching a page anytime during SSR by calling:

```javascript
context.app.$cache.page.setUncacheable()
```

Note that calling this method is *final*, which means that the page will not be
cached at all. This can't be reversed by calling setCacheable().

An example where this is useful: If you have a nested component in your tree
that failed to fetch data during rendering, you can prevent that the entire
page is cached with a broken component.


## Using cache tags

In order to be able to purge pages using cache tags, you can assign each page a
set of cache tags:

```javascript
context.app.$cache.page.addTags(['article:5', 'image:14'])
```

Typically you would receive these tags directly from the source, e.g. when
fetching data from a CMS, so that the CMS is in charge of purging tags when
content changes.

You can call this method multiple times, for example in a deeply nested
component, that fetches additional data using fetch().

## Caching of errors

By default, pages that return a status other than 200 can be cached as well.
It's up to the user of this module to decide if it should be cached.

When a cached response is returned, the corresponding HTTP status code is
returned as well.
