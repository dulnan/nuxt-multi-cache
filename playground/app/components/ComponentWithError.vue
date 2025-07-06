<template>
  <div>
    This will always throw an error.
    <span>{{ foo.bar.doesnotexist.toString() }}</span>
  </div>
</template>

<script setup lang="ts">
const foo: any = {
  bar: undefined,
}
</script>
