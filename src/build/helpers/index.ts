import { existsSync } from 'node:fs'
import type { ModuleOptions } from '../options'
import { DEFAULT_CACHE_TAG_INVALIDATION_DELAY } from '../options/defaults'

export const fileExists = (
  path?: string,
  extensions = ['js', 'ts', 'mts'],
): string | null => {
  if (!path) {
    return null
  } else if (existsSync(path)) {
    // If path already contains/forces the extension.
    return path
  }

  const extension = extensions.find((extension) =>
    existsSync(`${path}.${extension}`),
  )

  return extension ? `${path}.${extension}` : null
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

/**
 * Whether the Nitro preset builds for Cloudflare Workers.
 */
export function isCloudflarePreset(preset: string): boolean {
  return preset.startsWith('cloudflare')
}

/**
 * The delay for invalidating cache tags.
 *
 * Cloudflare Workers don't run timers after the response has been sent, so
 * the delay is always 0 for Cloudflare presets: Tags are purged during the
 * request.
 */
export function getCacheTagInvalidationDelay(
  options: ModuleOptions,
  nitroPreset: string,
): number {
  if (isCloudflarePreset(nitroPreset)) {
    return 0
  }

  return (
    options.api?.cacheTagInvalidationDelay ??
    DEFAULT_CACHE_TAG_INVALIDATION_DELAY
  )
}
