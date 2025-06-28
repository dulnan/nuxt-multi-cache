<template>
  <div>Trigger a server error.</div>
</template>

<script lang="ts" setup>
useCDNHeaders((cdn) => {
  cdn
    .setNumeric('maxAge', 6000)
    .public()
    .addTags(['tag-from-server-error-page'])
})

throw createError({
  statusCode: 500,
  fatal: true,
  statusMessage: 'Fatal error triggered in page component.',
})
</script>
