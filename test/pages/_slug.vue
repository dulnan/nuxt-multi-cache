<template>
  <div class="container">
    <div>
      <h1>{{ slug }}</h1>
    </div>

    <foo id="1" />
    <foo id="2" />
    <foo id="3" />
    <foo id="4" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Foo from './../components/Foo.vue'

export default Vue.extend({
  components: {
    Foo,
  },

  asyncData(ctx) {
    const slug = ctx.route.params.slug

    return { slug }
  },

  data() {
    return {
      slug: '',
    }
  },
})
</script>
