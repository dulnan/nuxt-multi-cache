---
title: Get components
description: Get stats about all cached components.
position: 264
category: 'REST API'
---
<p className="lead">
Get stats about all cached components.
</p>

## Resource
GET: `/__nuxt_multi_cache/stats/component`

## Query params

### offset

Return results starting at the specified index.

## Response

```json
{
  "rows": [
    {
      "key": "ProductTeaser::442_highlighted",
      "tags": ["product:442", "icon:32"],
      "timestamp": 1621172533530
    },
    {
      "key": "Footer::default",
      "tags": ["link:3", "link:4", "link:5", "link:6"],
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
  http://localhost:3000/__nuxt_multi_cache/stats/component
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/stats/component', {
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  })
})
```

</code-block>

</code-group>

