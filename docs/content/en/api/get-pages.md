---
title: Get pages
description: Get stats about all cached pages.
position: 262
category: 'REST API'
---
<p className="lead">
Get stats about all cached pages.
</p>

## Resource
GET: `/__nuxt_multi_cache/stats/page`

## Query params

### offset

Return results starting at the specified index.

## Response

```json
{
  "rows": [
    {
      "key": "/",
      "tags": ["config.system.page_title", "page:15", "group_navbar", "group_footer"],
      "timestamp": 1621172533530
    },
    {
      "key": "/product/324",
      "tags": ["product:324", "image:345", "link:21", "link:6"],
      "timestamp": 1621172580826
    }
  ],
  "total": 2
}
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X GET -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  http://localhost:3000/__nuxt_multi_cache/stats/page
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/stats/page', {
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  })
})
```

</code-block>

</code-group>

