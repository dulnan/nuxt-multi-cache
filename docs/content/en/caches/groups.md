---
title: Cache Groups
position: 130
category: 'Caches'
---

<p className="lead">
Cache groups allow you to group two or more cache tags together under a single
tag, which can then be used like a regular cache tag.
</p>

A typical use case would be a `<navbar />` component that fetches 100 menu
links from a CMS, which results in 100 cache tags.

Now whenever a menu link is edited, the CMS might purge the tag of this link.
This will invalidate all cached pages, because the menu component appears on
all of them.

You could add those 100 tags to the cache tags of the page, but that's quite a
lot of duplication. That's where cache groups are a good solution.

## Config

Enable the cache group module:

```javascript
module.exports = {
  multiCache: {
    groupsCache: {
      enabled: true
    },
  }
}
```

## Creating a cache group

```javascript
this.$cache.groups.add('group_menu', ['link:1', 'link:2', ...rest])
```

You can then use `group_menu` like any regular cache tag. This is basically the
same as adding 100 cache tags - but just with one:

```javascript
this.$cache.page.addTags(['article:5', 'image:14', 'group_menu'])
```

## Cache group invalidation

You can either purge the cache group name directly or any tag that belongs to a
group. In our example, if you'd purge `link:4`, it would purge all cache
entries with that tag, but also all entries with the `group_menu` tag.
