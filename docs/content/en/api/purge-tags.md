---
title: Purge by tag
description: Purge all cache entries belonging to one or more cache tags.
position: 220
category: 'REST API'
---
<p className="lead">
Purge all cache entries belonging to one or more cache tags.
</p>

## Resource
POST: `/__nuxt_multi_cache/purge/tags`

## Body

JSON encoded array of tags.

```json
[ "tag:1", "tag:4", "tag:42" ]
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["article:5"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/tags', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  }),
  body: JSON.stringify(['article:5'])
})
```

</code-block>

</code-group>

