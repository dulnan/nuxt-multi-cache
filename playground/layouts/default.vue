<template>
  <div class="main-layout">
    <header>
      <RenderCacheable cache-key="navbar">
        <Navbar />
      </RenderCacheable>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<style>
.main-layout {
  display: grid;
  grid-template-columns: 20rem 1fr;
  grid-gap: 2rem;
  padding: 2rem;
}
</style>
