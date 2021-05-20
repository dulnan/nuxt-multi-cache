---
title: Purge components
description: Purge one or more components from the component cache.
position: 240
category: 'REST API'
---
<p className="lead">
Purge one or more components from the component cache.
</p>

## Resource
POST: `/__nuxt_multi_cache/purge/component`

## Body

JSON encoded array of component keys.

```json
["Footer::default", "ProductTeaser::442_highlighted"]
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["Footer::default", "ProductTeaser::442_highlighted"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/component', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  }),
  body: JSON.stringify(['Footer::default', 'ProductTeaser::442_highlighted'])
})
```

</code-block>

</code-group>

