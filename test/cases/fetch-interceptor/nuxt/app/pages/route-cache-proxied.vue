<template>
  <div>
    <div id="headers">{{ data?.headers.join(',') }}</div>
  </div>
</template>

<script setup lang="ts">
import { useCacheAwareFetchInterceptor, useFetch } from '#imports'

const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch<{ headers: string[] }>(
  '/api/proxied',
  interceptor,
)
</script>
