---
title: Purge groups
description: Purge one or more cache groups from the groups cache.
position: 250
category: 'REST API'
---
<p className="lead">
Purge one or more cache groups from the groups cache.
</p>

<alert>
This does not purge pages, components or data associated with this tag. It just
removes the cache group from the database.
</alert>

## Resource
POST: `/__nuxt_multi_cache/purge/groups`

## Body

JSON encoded array of cache group names.

```json
["group_menu"]
```

## Example

<code-group>
<code-block label="cURL" active>

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["group_menu"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/groups
```

</code-block>

<code-block label="node-fetch">

```javascript
fetch('http://localhost:3000/__nuxt_multi_cache/purge/groups', {
  method: 'POST',
  headers: new Headers({
    Authorization: 'Basic YWRtaW46aHVudGVyMgo='
  }),
  body: JSON.stringify(['group_menu'])
})
```

</code-block>

</code-group>

