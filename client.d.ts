declare module 'nuxt-multi-cache/client' {
  export function getServerCacheKey(key: string | boolean, tags?: any[]): string | boolean;
}
