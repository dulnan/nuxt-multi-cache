<template>
  <div>
    <RenderCacheable cache-key="one" :cache-tags="['tag1']">
      <QueryValue />
    </RenderCacheable>
  </div>
</template>
