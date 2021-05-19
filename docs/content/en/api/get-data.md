---
title: Get data
position: 266
category: 'REST API'
---
<p className="lead">
Get stats about all cached data items.
</p>

## Resource
GET: `/__nuxt_multi_cache/stats/data`

## Query params

### offset

Return results starting at the specified index.

## Response

```json
{
  "rows": [
    {
      "key": "menu_api",
      "tags": ["config.menu.main", "menu_link:23"],
      "timestamp": 1621172533530
    },
    {
      "key": "footer_links",
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
  http://localhost:3000/__nuxt_multi_cache/stats/data
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/stats/data', {
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  })
})
```

</code-block>

</code-group>

