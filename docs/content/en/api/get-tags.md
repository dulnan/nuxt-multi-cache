---
title: Get tags
description: Get stats about all tags.
position: 260
category: 'REST API'
---

<p className="lead">
Get stats about all tags.
</p>

## Resource
GET: `/__nuxt_multi_cache/stats/tags`

## Query params

### offset

Return results starting at the specified index.

## Response

```json
{
  "rows": [
    {
      "tag": "article:10",
      "total": 24,
      "counts": {
        "page": 12,
        "component": 8,
        "data": 4
      }
    },
    {
      "tag": "link:32",
      "total": 18,
      "counts": {
        "page": 17,
        "component": 1
      }
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
  http://localhost:3000/__nuxt_multi_cache/stats/tags
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/stats/tags', {
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  })
})
```

</code-block>

</code-group>

