<template>
  <div>
    <h1>CDN header merging</h1>
    <code><pre v-html="JSON.stringify(data)" /></code>
  </div>
</template>

<script lang="ts" setup>
const event = useRequestEvent()

const { data } = await useFetch('/api/cdnHeaders', {
  onResponse(ctx) {
    useCDNHeaders((cdn) => cdn.mergeFromResponse(ctx.response), event)
  },
})

useCDNHeaders((cdn) => {
  cdn.addTags(['page:1', 'foobar']).setNumeric('maxAge', 3600)
}, event)
</script>
