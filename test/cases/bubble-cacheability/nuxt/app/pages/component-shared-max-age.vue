<template>
  <div>
    <RenderCacheable bubble-cacheability>
      <CaseComponent />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { useCDNHeaders } from '#imports'

// Shared caches may keep the page for a day, but the component's max age is
// lower.
useCDNHeaders((cdn) => {
  cdn.public().setNumeric('maxAge', 9000).setNumeric('sharedMaxAge', 86400)
})
</script>
