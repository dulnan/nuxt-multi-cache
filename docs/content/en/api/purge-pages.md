---
title: Purge pages
description: Purge one or more pages from the page cache.
position: 230
category: 'REST API'
---
<p className="lead">
Purge one or more pages from the page cache.
</p>

## Resource
POST: `/__nuxt_multi_cache/purge/page`

## Body

JSON encoded array of page keys.

```json
["/product/123", "/", "/blog/2021/05/lorem-ipsum-dolor"]
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["/product/123", "/", "/blog/2021/05/lorem-ipsum-dolor"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/page
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/page', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  }),
  body: JSON.stringify(['/product/123', '/', '/blog/2021/05/lorem-ipsum-dolor'])
})
```

</code-block>

</code-group>

