<template>
  <div>
    <div id="page">{{ renderId }}</div>
    <div id="api">{{ data?.renderId }}</div>
  </div>
</template>

<script lang="ts" setup>
import {
  useCacheAwareFetchInterceptor,
  useFetch,
  useRouteCache,
} from '#imports'

// Date.now() only advances after I/O in workerd, so a random ID tells renders
// apart.
const renderId = crypto.randomUUID()

// The interceptor marks the request with the internal request token, so the
// tag of the API route is added to the page.
const { data } = await useFetch<{ renderId: string }>(
  '/api/render-id',
  useCacheAwareFetchInterceptor(),
)

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge('1h').addTags(['page'])
})
</script>
