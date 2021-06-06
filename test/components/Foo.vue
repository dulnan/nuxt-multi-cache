<template>
  <div class="foo">
    <h1>Component: Foo</h1>
    <p>{{ id }}</p>
    <div class="hash">{{ hash }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
const { getServerCacheKey } = require('./../../client')

export default Vue.extend({
  name: 'Foo',
  props: {
    id: {
      type: String,
      default: '',
    },
  },

  serverCacheKey(props) {
    return getServerCacheKey(props.id, ['foo:' + props.id])
  },

  computed: {
    hash() {
      return this.$route.query.hash
    },
  },
})
</script>

<style></style>
