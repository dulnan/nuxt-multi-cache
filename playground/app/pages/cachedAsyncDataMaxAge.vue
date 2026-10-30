<template>
  <div>
    <h1>useCachedAsyncData with max age</h1>
    <div id="time">{{ data }}</div>
    <NuxtLink id="go-to-home" to="/">Go to Home</NuxtLink>
  </div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData, useRoute } from '#imports'
import type { MaxAge } from '../../../src/runtime/helpers/maxAge'

const route = useRoute()

/**
 * Parse the max age from a query param. "undefined" omits the option.
 */
function getMaxAge(name: string): MaxAge | undefined {
  const value = route.query[name]?.toString() ?? 'undefined'
  if (value === 'undefined') {
    return undefined
  } else if (/^-?\d+$/.test(value)) {
    return parseInt(value)
  }

  return value as MaxAge
}

const server = route.query.server?.toString() ?? 'undefined'
const client = route.query.client?.toString() ?? 'undefined'

const { data } = await useCachedAsyncData(
  `max-age--${server}--${client}`,
  () => Promise.resolve(Date.now().toString()),
  {
    serverMaxAge: getMaxAge('server'),
    clientMaxAge: getMaxAge('client'),
  },
)
</script>
