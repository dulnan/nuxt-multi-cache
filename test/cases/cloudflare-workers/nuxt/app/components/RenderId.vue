<template>
  <div id="component">{{ renderId }}</div>
</template>

<script lang="ts" setup>
const renderId = crypto.randomUUID()
</script>
