---
title: Purge data
description: Purge one or more data items from the data cache.
position: 240
category: 'REST API'
---
<p className="lead">
Purge one or more data items from the data cache.
</p>

## Resource
POST: `/__nuxt_multi_cache/purge/data`

## Body

JSON encoded array of data keys.

```json
["api_navbar"]
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["api_navbar"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/data
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/data', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  }),
  body: JSON.stringify(['api_navbar'])
})
```

</code-block>

</code-group>

