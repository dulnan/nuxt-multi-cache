---
title: Purge everything
position: 210
category: 'REST API'
---
<p className="lead">
Purge all caches.
</p>

## Resource
POST: `/__nuxt_multi_cache/purge/all`

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  http://localhost:3000/__nuxt_multi_cache/purge/all
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/all', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  })
})
```

</code-block>

</code-group>

