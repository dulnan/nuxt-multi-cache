<template>
  <div>
    <RenderCacheable :max-age="9999999999">
      <CaseMaxAgeMerge />
    </RenderCacheable>
  </div>
</template>
