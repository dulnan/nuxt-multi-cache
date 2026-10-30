<template>
  <div>
    <CaseForwardedSlot :cache-key="route.query.key?.toString()">
      <CaseForwardedSlotContent />
    </CaseForwardedSlot>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#imports'

const route = useRoute()
</script>
