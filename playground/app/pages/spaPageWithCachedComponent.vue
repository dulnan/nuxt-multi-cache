<template>
  <div>
    <h1>Only rendered client side</h1>
    <RenderCacheable cache-tag="page-with-cached-component">
      <div id="spa-text">Component rendered.</div>
    </RenderCacheable>
  </div>
</template>
