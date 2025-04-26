<template>
  <div>
    <h1>CDN header merging</h1>
    <code><pre v-html="JSON.stringify(data)" /></code>
  </div>
</template>

<script lang="ts" setup>
const event = useRequestEvent()

const { data } = await useFetch('/api/cdnHeaders', {
  onResponse({ response }) {
    useCDNHeaders((cdn) => cdn.mergeFromResponse(response))
  },
})

useCDNHeaders((cdn) => {
  cdn.addTags(['page:1', 'foobar']).setNumeric('maxAge', 60)
}, event)
</script>
