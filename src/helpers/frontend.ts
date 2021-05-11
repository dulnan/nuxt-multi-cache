/**
 * Helper method to build the component cache key, including cache tags.
 */
export function getServerCacheKey(
  key: string | boolean,
  tags: any[] = []
): string | boolean {
  if (key === false) {
    return key
  }

  return `${key}____${tags.join('$')}`
}
