<template>
  <div>{{ data }}</div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData, useCookie, useRoute } from '#imports'

const route = useRoute()
const isPremium = useCookie('plan').value === 'premium'

// The cache key is built from the route.
const { data } = await useCachedAsyncData(
  route.params.slug as string,
  () => Promise.resolve(isPremium ? 'PREMIUM-CONTENT' : 'PUBLIC-CONTENT'),
  { serverMaxAge: 3600 },
)
</script>
