<template>
  <tr :class="{ 'has-background-warning': status === 'pending' }">
    <td class="index">{{ index }}</td>
    <td class="status">{{ status }}</td>
    <td class="value">{{ value }}</td>
  </tr>
</template>

<script setup lang="ts">
import { useLazyFetch, computed } from '#imports'

const props = defineProps<{
  index: number
  slow?: boolean
}>()

const { data, status } = await useLazyFetch('/api/slowApiRequest', {
  params: {
    slow: props.slow ? 'true' : undefined,
    index: props.index,
  },
})

const value = computed<number | undefined>(() => data.value?.data)
</script>
