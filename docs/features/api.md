# Cache Management API

This feature provides several API endpoints to manage the caches. You can get a
list of cache items, inspect cache items, delete items by key or delete items by
cache tags.

## Configuration

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    api: {
      enabled: true,
      prefix: '/__nuxt_multi_cache',
      authorization: 'hunter2',
      cacheTagInvalidationDelay: 60000
    }
  }
}
```

```typescript [multiCache.serverOptions.ts]
// ~/server/multiCache.serverOptions.ts
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { isAuthenticated } from './somewhere'

export default defineMultiCacheOptions({
  api: {
    // Use a custom method that checks authorization. Can be something like
    // cookie, basic auth or request IP.
    authorization: async function (event) {
      return await isAuthenticated(event)
    },
  },
})
```

:::

### Authorization

By default the endpoints are not accesible without authorization.

#### Token based (x-nuxt-multi-cache-token)

This is the default authorization used when the `api.authorization` option is
provided. In this case the token is expected in the `x-nuxt-multi-cache-token`
header:

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/component', {
  method: 'POST',
  headers: {
    // [!code focus]
    'x-nuxt-multi-cache-token': 'hunter2', // [!code focus]
  }, // [!code focus]
  body: JSON.stringify(['Navbar::de--chf']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \ // [!code focus]
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

:::

It's also possible to
[provide the token using runtime config](/overview/runtime-config#api-authorization-token):

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN=PtSR0mDATQpNlvNgqRf
```

#### Custom Callback

You can also implement your own
[authorization check via the server options](/overview/server-options#custom-api-authorization).

#### Disabled

You can disable authorization by setting the value of `api.authorization` to
`false`. **Only do this if the endpoints are not accessible publicly!**

## Purge Everything

Purges everything from all caches.

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/all', {
  method: 'POST',
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -X POST -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/purge/all
```

:::

::: details Response

```json
{
  "status": "OK"
}
```

:::

## Purge Item

Purge one or more cache items by key.

### Example: Purge component with key `Navbar::de--chf`

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/component', {
  method: 'POST',
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['Navbar::de--chf']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

:::

::: details Response

```json
{
  "status": "OK",
  "affectedKeys": ["Navbar::de--chf"]
}
```

:::

### Example: Purge two specific pages

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/route', {
  method: 'POST',
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['/about', '/product/123']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["/about", "/product/123"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/route
```

:::

::: details Response

```json
{
  "status": "OK",
  "affectedKeys": ["/about", "/product/123"]
}
```

:::

## Purge Tags

Purge cache items by cache tags.

::: info

All tags are collected for some time (default: 1min), after which the cache
items are purged. This is because cache tags are stored together with the items.
This means that every item needs to be loaded from the cache and its tags
checked.

The delay is configurable via the `api.cacheTagInvalidationDelay` option.

:::

### Example Purge all cache items with cache tag `language:de`

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/tags', {
  method: 'POST',
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['language:de']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

:::

::: details Response

```json
{
  "status": "OK",
  "tags": ["language:de"]
}
```

:::

## Get Stats

Get a list of all items in a cache.

### Example: Get a list of all cached components

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/stats/component', {
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/stats/component
```

:::

::: details Response

```json
{
  "status": "OK",
  "rows": [
    {
      "key": "RandomNumber",
      "data": "<div><h3>Component with random number</h3><div>RANDOM_NUMBER__686204309__</div></div>"
    },
    {
      "key": "Navbar:navbar",
      "data": {
        "payload": {
          "navbar": [
            {
              "userId": "39a2cbd1-5355-42ee-b519-a378ac12ecf4",
              "username": "Morris.Sipes93",
              "email": "Eda_Barton@hotmail.com",
              "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1116.jpg",
              "password": "KQ6UY3mgK6VZsJd",
              "birthdate": "1948-01-06T21:31:06.050Z",
              "company": "Ward Group",
              "registeredAt": "2022-01-06T19:41:51.910Z"
            }
          ]
        },
        "data": "<nav class=\"menu\"><div class=\"menu-label\">User Management</div><ul class=\"menu-list\"><!--[--><li><a href=\"/user/39a2cbd1-5355-42ee-b519-a378ac12ecf4\" class=\"\"><div>Morris.Sipes93</div></a></li><li><a href=\"/user/21ef84d0-fc1e-44f6-8ba7-038eba022140\" class=\"\"><div>Toni_Lehner95</div></a></li><li><a href=\"/user/b7c1f5eb-d8ca-4e55-8327-c0fd27029cfc\" class=\"\"><div>Clay.Marvin6</div></a></li><li><a href=\"/user/bbaf0d1b-a446-4f68-b745-c61cd4b5adf6\" class=\"\"><div>Chanel76</div></a></li><li><a href=\"/user/4aeac8ae-7ddf-4f8d-a015-3b059f00b554\" class=\"\"><div>Lurline.Reinger97</div></a></li><li><a href=\"/user/97625fcb-c105-4191-9614-92abc4f06b02\" class=\"\"><div>Theodora.Harris13</div></a></li><li><a href=\"/user/d537b431-ed2c-41f3-8b08-771cb0bdf88a\" class=\"\"><div>Garth.Kuphal</div></a></li><li><a href=\"/user/6575f732-8330-4543-b6b0-4d6bf863b9d3\" class=\"\"><div>Fannie36</div></a></li><li><a href=\"/user/e998007e-3cc6-45b5-9e57-1b64a339f748\" class=\"\"><div>Peggie57</div></a></li><li><a href=\"/user/3552155b-47d6-490f-9469-aa3861410af1\" class=\"\"><div>Tina_Lakin</div></a></li><li><a href=\"/user/763c86fe-1202-4ac1-84cd-2aa037a8b13a\" class=\"\"><div>Minnie.Fisher6</div></a></li><li><a href=\"/user/8cccd3b8-4655-4dc6-8058-d916c8ed1d7c\" class=\"\"><div>Lillian28</div></a></li><li><a href=\"/user/5252b0ab-71e1-4c0e-a368-9baac986f6a1\" class=\"\"><div>Brielle84</div></a></li><li><a href=\"/user/b91f68eb-b20d-4d37-9d2a-221263afe62f\" class=\"\"><div>Oleta58</div></a></li><li><a href=\"/user/e72dc150-6cc2-468d-b09c-6cda68de897b\" class=\"\"><div>Tristian18</div></a></li><li><a href=\"/user/6db46653-6b5f-4fc9-b594-f0593b6734f7\" class=\"\"><div>Diamond_Watsica</div></a></li><li><a href=\"/user/39aa5c69-9cb0-42cd-8dcf-bebc029efd6e\" class=\"\"><div>Emma92</div></a></li><li><a href=\"/user/05946ea1-8395-4a49-98f8-edb12865f2b0\" class=\"\"><div>Guillermo_Deckow</div></a></li><li><a href=\"/user/ec5ed51d-880d-4a5e-84a3-96c12d1bc543\" class=\"\"><div>Shanny.Wolff33</div></a></li><li><a href=\"/user/1b555aad-db68-4da7-9a6b-442e8ee1a5f0\" class=\"\"><div>Whitney.Johns2</div></a></li><li><a href=\"/user/c8dc7fea-1a92-486f-a14d-366363aec9d7\" class=\"\"><div>Mertie98</div></a></li><li><a href=\"/user/a7b8938b-e98e-4be0-b0c2-851a08297757\" class=\"\"><div>Colt.Fadel94</div></a></li><li><a href=\"/user/abaa3c97-9ddb-402a-b0f6-1eb198591ddb\" class=\"\"><div>General39</div></a></li><li><a href=\"/user/dc0cbecd-c7ac-4f77-9a0e-07e93ae32d5c\" class=\"\"><div>Beryl.Pfeffer</div></a></li><li><a href=\"/user/8d62b5af-9f72-4a96-a630-ca20ebe563c6\" class=\"\"><div>Amara.Torp</div></a></li><li><a href=\"/user/7dbd1dbc-2edc-4b24-b808-5a6f5513bc61\" class=\"\"><div>Adah.Shanahan14</div></a></li><li><a href=\"/user/f0390c1a-a6aa-4619-aa8b-ae301124e6e1\" class=\"\"><div>Jakayla.Weissnat69</div></a></li><li><a href=\"/user/56183ace-6df4-44b8-8b94-f9580200e89f\" class=\"\"><div>Rogelio85</div></a></li><li><a href=\"/user/bbf22b16-086a-4722-a826-702f93d0889f\" class=\"\"><div>Francisca.Schoen</div></a></li><li><a href=\"/user/33b639ce-5e77-49f5-ad64-db961626ac9a\" class=\"\"><div>Viola.Paucek</div></a></li><li><a href=\"/user/f0e4c598-8ee9-4d4f-a374-624d71c11c57\" class=\"\"><div>Juston.Yost92</div></a></li><li><a href=\"/user/f32e5726-cc61-446a-885c-760bbd8c6927\" class=\"\"><div>Elisabeth87</div></a></li><li><a href=\"/user/469f3fe5-0809-498f-bf87-deaa7cb92f0b\" class=\"\"><div>Kara.Gerlach</div></a></li><li><a href=\"/user/6701a0d0-731e-42e1-b829-d9a68082bfd3\" class=\"\"><div>Virgil.Donnelly</div></a></li><li><a href=\"/user/00a3c2b5-0ebe-4dfe-b449-007d6358f5f9\" class=\"\"><div>Priscilla.Larson81</div></a></li><li><a href=\"/user/93c05ae9-9b32-41f5-87ba-9083e222de5d\" class=\"\"><div>Wilbert.Nienow4</div></a></li><li><a href=\"/user/408a819f-4466-40b9-bf2d-d70ab346a17d\" class=\"\"><div>Casandra_Koch97</div></a></li><li><a href=\"/user/8c73b048-4fcb-489a-b25d-c42820d79378\" class=\"\"><div>Ettie_Wunsch96</div></a></li><li><a href=\"/user/6ec6cfb3-add2-4fe6-8bdd-f8ada6b40634\" class=\"\"><div>Myrtie.Armstrong31</div></a></li><li><a href=\"/user/9a248b35-3170-46d9-9b32-eec604dddf64\" class=\"\"><div>Kristy88</div></a></li><li><a href=\"/user/00e5b583-dfd9-457b-967a-d996656c7838\" class=\"\"><div>Fern69</div></a></li><li><a href=\"/user/f8f942cb-68c1-4ca4-9260-237f453a2f3d\" class=\"\"><div>Jamil8</div></a></li><li><a href=\"/user/daa8f430-e028-4286-9aff-1aed84837f3a\" class=\"\"><div>Charlie.Baumbach59</div></a></li><li><a href=\"/user/d08c8290-d141-4f14-aefd-5a64077f40cf\" class=\"\"><div>Jerel92</div></a></li><li><a href=\"/user/547f6abc-826f-4556-9a25-a2c6d05ba309\" class=\"\"><div>Noemi_Hackett</div></a></li><li><a href=\"/user/44ff5048-454e-431d-a536-0d872a925c86\" class=\"\"><div>Palma.Harris41</div></a></li><li><a href=\"/user/19c78f97-d1fe-441e-9670-abc49c6b6904\" class=\"\"><div>Andrew.Kris</div></a></li><li><a href=\"/user/86e40067-3ea7-4f08-ae46-c63a774172dc\" class=\"\"><div>Alize80</div></a></li><li><a href=\"/user/b0c5de1c-3510-4687-b380-05fff955329d\" class=\"\"><div>Daisha54</div></a></li><li><a href=\"/user/e27c637e-71be-499d-86e3-f961a9f42895\" class=\"\"><div>Aileen65</div></a></li><li><a href=\"/user/4d19b09e-7d41-45fd-a28d-9bbeadb088ef\" class=\"\"><div>Hassie_Keebler</div></a></li><li><a href=\"/user/fd15318d-f157-4b7f-8fe8-942c684c5659\" class=\"\"><div>Justice_Renner48</div></a></li><li><a href=\"/user/dd47a3cb-4ed8-450b-afd1-64029c3411a8\" class=\"\"><div>Jana_Lindgren</div></a></li><li><a href=\"/user/4104f890-ffa5-48a6-a22f-f67a8c34818c\" class=\"\"><div>Gerson_Mohr</div></a></li><li><a href=\"/user/52f00f81-8e4c-45ea-8f87-90159b2ec8a5\" class=\"\"><div>Eudora3</div></a></li><li><a href=\"/user/41d8ab07-05f2-4c64-83cc-63d43714b504\" class=\"\"><div>Okey52</div></a></li><li><a href=\"/user/965ef3ba-b980-4b7b-b9a4-7d334f25cbf9\" class=\"\"><div>Melba.Larkin</div></a></li><li><a href=\"/user/95be11ca-17e1-4406-93cd-6e35cdb304ef\" class=\"\"><div>Ethelyn28</div></a></li><li><a href=\"/user/4e6640ac-542c-4ba8-bf12-46977227d8b6\" class=\"\"><div>Rafaela_Reynolds61</div></a></li><li><a href=\"/user/e269d239-a2e5-4363-8657-93aca32351c1\" class=\"\"><div>Patsy84</div></a></li><li><a href=\"/user/5171ba0e-32bc-47d7-a277-df5f867db141\" class=\"\"><div>Jarrett.Walter63</div></a></li><li><a href=\"/user/6e913422-3e4a-44ed-82e3-a7f94b2e9903\" class=\"\"><div>Roscoe_Kautzer84</div></a></li><li><a href=\"/user/0a3f5804-eb14-4240-8592-654fc089b25e\" class=\"\"><div>Wilbert92</div></a></li><li><a href=\"/user/e82ebbc4-9d80-4b92-b727-b4ebae5532ba\" class=\"\"><div>Neoma51</div></a></li><li><a href=\"/user/6c0992a8-deac-4142-bb30-1fe6926be421\" class=\"\"><div>Maybelle.Gerlach66</div></a></li><li><a href=\"/user/2a626912-ab62-443e-87ec-97770e2792be\" class=\"\"><div>Otilia.Baumbach71</div></a></li><li><a href=\"/user/991526d1-b646-42a6-8726-f97282b72303\" class=\"\"><div>Stacy.Marks52</div></a></li><li><a href=\"/user/2d9cbc1a-27ac-42fe-96ab-68c877be529d\" class=\"\"><div>Stephen_Murphy94</div></a></li><li><a href=\"/user/f1051c2b-8a22-479f-9844-b2b01130477e\" class=\"\"><div>Peter_Hickle</div></a></li><li><a href=\"/user/7a88feda-d737-44ea-a365-4fc51d0a8251\" class=\"\"><div>Rebeka.Stanton79</div></a></li><li><a href=\"/user/6958d9f9-2d3c-4f7a-8176-c98adc3df90e\" class=\"\"><div>Haley71</div></a></li><li><a href=\"/user/7c28ce1a-3c4f-42ee-9b09-58fac6cf6e25\" class=\"\"><div>Lawrence.Runte</div></a></li><li><a href=\"/user/ac67e362-2a2c-4cbb-8e53-e375686f21f9\" class=\"\"><div>Izabella55</div></a></li><li><a href=\"/user/f0c9587e-3bbf-448f-b8b7-abc4b1f87349\" class=\"\"><div>Deanna_Crist</div></a></li><li><a href=\"/user/749b7e30-6da2-4861-8b7e-b1fdf8474c66\" class=\"\"><div>Branson_Windler</div></a></li><li><a href=\"/user/c9ebdb78-5bcf-46ac-b516-c679459d0bf0\" class=\"\"><div>Frederique.Olson47</div></a></li><li><a href=\"/user/e830119e-1204-4024-98be-6e7b393f2168\" class=\"\"><div>Kale.Ferry</div></a></li><li><a href=\"/user/43b2fd88-e4de-4d38-a8e9-b41043fffdad\" class=\"\"><div>Tessie_Streich10</div></a></li><li><a href=\"/user/d64cad41-ae8a-4537-81a9-688763600b48\" class=\"\"><div>Fabian_Dickinson</div></a></li><li><a href=\"/user/5541b857-3b66-45fe-a477-2de33bc7f4b6\" class=\"\"><div>Emmitt.Pouros59</div></a></li><li><a href=\"/user/921163c6-d3cf-4f2e-bd79-b62fefa391d8\" class=\"\"><div>Amanda.Bayer40</div></a></li><li><a href=\"/user/d5dbb6a8-6c40-4dc1-88ca-b7d6b7119d2f\" class=\"\"><div>Coby.Macejkovic</div></a></li><li><a href=\"/user/fa6af5fe-9773-471f-b0a4-55e45a27d86d\" class=\"\"><div>Waino.Greenholt79</div></a></li><li><a href=\"/user/f21f5ac2-96e0-4552-8046-8cb2b2ba2b61\" class=\"\"><div>Natalie_Rodriguez35</div></a></li><li><a href=\"/user/37c4649d-9c9c-4997-bd51-eafa05f33846\" class=\"\"><div>Mozelle_Jakubowski67</div></a></li><li><a href=\"/user/a5ad0979-b8dc-4629-a785-544fa692a4a2\" class=\"\"><div>Tristian.Kub</div></a></li><li><a href=\"/user/7f990462-fa52-413f-b0dc-963e834e963e\" class=\"\"><div>Ernestine17</div></a></li><li><a href=\"/user/d309aafc-9dbd-4a61-bf2e-65e9cfa3872f\" class=\"\"><div>Gabrielle_Bechtelar34</div></a></li><li><a href=\"/user/cdd0d705-da86-4cb1-a34f-f0fad9ba0ad8\" class=\"\"><div>Harvey.Schmeler8</div></a></li><li><a href=\"/user/cdded4d9-5349-4e1b-8ebe-903f86d988d2\" class=\"\"><div>Bartholome.Kunde62</div></a></li><li><a href=\"/user/f9994317-8087-4a8c-9e70-eea0d068d605\" class=\"\"><div>Miguel_Cartwright</div></a></li><li><a href=\"/user/44c49163-0fd3-4a53-960f-7b3c0f2711fd\" class=\"\"><div>Anabel.Raynor</div></a></li><li><a href=\"/user/68cdb875-5c78-4ec3-9bb0-80ca67e319db\" class=\"\"><div>Rosario_Paucek</div></a></li><li><a href=\"/user/0e8e6eae-7a05-41c2-81ac-810b386e69da\" class=\"\"><div>Floy.Boehm70</div></a></li><li><a href=\"/user/30c3cb1b-ed38-46f2-a075-c668c1800c73\" class=\"\"><div>Neal71</div></a></li><li><a href=\"/user/0735f8c1-a936-45ea-95ec-15d81025f6f9\" class=\"\"><div>Federico.Schulist78</div></a></li><li><a href=\"/user/16eca0de-2305-40b8-becd-ac36215f7b91\" class=\"\"><div>Aniyah.Kemmer5</div></a></li><li><a href=\"/user/50a25953-0684-4571-94d4-16d40159e48a\" class=\"\"><div>Anthony.Boyer61</div></a></li><li><a href=\"/user/ddb67f21-b04c-4850-a187-7d50c5f37ef7\" class=\"\"><div>Clare.Feest</div></a></li><li><a href=\"/user/e5d21e08-c98d-496d-ae2b-456a425aac4e\" class=\"\"><div>Carli_Cartwright74</div></a></li><!--]--></ul></nav>",
        "cacheTags": []
      }
    }
  ],
  "total": 2
}
```

:::

## Inspect

Inspect a cache item. The key should be provided as a query param `key`.

### Example: Get the markup of the cached component with key `Navbar::de`

::: code-group

```typescript [fetch]
fetch(
  'http://localhost:3000/__nuxt_multi_cache/inspect/component?key=RandomNumber',
  {
    headers: {
      'x-nuxt-multi-cache-token': 'hunter2',
    },
  },
)
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/inspect/component?key=RandomNumber
```

:::

::: details Response

```html
<div>
  <h3>Component with random number</h3>
  <div>RANDOM_NUMBER__837458809__</div>
</div>
```

:::

### Example: Get the details of a cached route

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/inspect/route?key=api:test', {
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/inspect/route?key=api:test
```

:::

::: details Response

```json
{
  "data": "{\n  \"api\": \"This is data from the API.\",\n  \"now\": \"2022-12-31T08:07:43.737Z\",\n  \"cacheTags\": [\n    \"page:1\",\n    \"image:234\",\n    \"user:32\",\n    \"language\",\n    \"translations\"\n  ]\n}",
  "headers": {
    "content-type": "application/json",
    "surrogate-control": "max-age=0, must-revalidate, public, stale-while-revalidate=60000, stale-if-error=24000"
  },
  "statusCode": 200,
  "expires": 1672474074,
  "cacheTags": [
    "page:1",
    "image:234",
    "user:32",
    "language",
    "translations"
  ]
}
:::
```
