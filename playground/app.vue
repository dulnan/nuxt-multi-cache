<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <RenderCacheable cache-key="helloworld">
      <div>HELLO THERE</div>
    </RenderCacheable>
  </div>
</template>

<script setup></script>
<style>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css';
</style>
