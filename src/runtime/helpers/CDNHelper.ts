import { CacheControl, parse } from '@tusbar/cache-control'
import { setResponseHeader, type H3Event } from 'h3'
import type { FetchResponse } from 'ofetch'
import { onlyUnique } from './server'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  expiresToMaxAge,
  parseMaxAge,
  type MaxAge,
} from './maxAge'
import { logger } from './multi-cache-logger'
import {
  cdnCacheControlHeader,
  cdnCacheTagHeader,
} from '#nuxt-multi-cache/config'
import type { CacheableItemInterface } from '../types'
import type { CacheabilityInterface } from './CacheabilityInterface'

const numericProperties = [
  'maxAge',
  'maxStaleDuration',
  'minFresh',
  'sharedMaxAge',
  'staleIfError',
  'staleWhileRevalidate',
] as const

const booleanProperties = [
  'immutable',
  'maxStale',
  'mustRevalidate',
  'mustUnderstand',
  'noCache',
  'noStore',
  'noTransform',
  'onlyIfCached',
  'proxyRevalidate',
] as const

/**
 * The directives managed by CacheControl, which can't be added as custom
 * directives.
 */
const standardDirectives = new Set([
  'immutable',
  'max-age',
  'max-stale',
  'min-fresh',
  'must-revalidate',
  'must-understand',
  'no-cache',
  'no-store',
  'no-transform',
  'only-if-cached',
  'private',
  'proxy-revalidate',
  'public',
  's-maxage',
  'stale-if-error',
  'stale-while-revalidate',
])

/**
 * A token as defined in RFC 9110, section 5.6.2.
 */
const tokenRegex = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/**
 * The characters allowed in a quoted-string (RFC 9110, section 5.6.4), which
 * are also the only characters allowed in a header value.
 */
const quotableRegex = /^[\t\x20-\x7E\x80-\xFF]*$/

/**
 * Format a custom directive.
 *
 * Returns null if the value can't be represented in a header.
 */
function formatCustomDirective(name: string, value: unknown): string | null {
  if (value === true) {
    return name
  }

  if (typeof value === 'number') {
    const integer = Math.floor(value)
    return integer >= 0 && Number.isSafeInteger(integer)
      ? `${name}=${integer}`
      : null
  }

  if (typeof value === 'string') {
    if (tokenRegex.test(value)) {
      return `${name}=${value}`
    }
    if (quotableRegex.test(value)) {
      return `${name}="${value.replace(/[\\"]/g, '\\$&')}"`
    }
  }

  return null
}

/**
 * Returns the lower of the two values. A current value of null is not set.
 */
function lowest(current: number | null, value: number): number {
  return current === null ? value : Math.min(current, value)
}

type CacheControlProperties = keyof Omit<CacheControl, 'private' | 'public'>
type CacheControlNumericProperties = keyof Pick<
  CacheControl,
  (typeof numericProperties)[number]
>

type CacheControlBooleanProperties = keyof Pick<
  CacheControl,
  (typeof booleanProperties)[number]
>

export class NuxtMultiCacheCDNHelper implements CacheabilityInterface {
  _tags: string[]
  _control: CacheControl
  _customDirectives: Map<string, string>

  /**
   * The lowest max age set by the app with setNumeric() or set(). Unlike the
   * max-age directive, it doesn't include values merged from other responses
   * or bubbled from cached items.
   */
  _ownMaxAge: number | null = null

  /**
   * The lowest lifetime for shared caches of the merged responses and bubbled
   * items: Their s-maxage or, without one, their max age.
   */
  _mergedSharedMaxAge: number | null = null

  /**
   * Whether a merged response had an s-maxage.
   */
  _hasMergedSharedMaxAge = false
  constructor(
    private readonly now: number,
    public readonly cacheControlHeader = cdnCacheControlHeader,
    public readonly cacheTagsHeader = cdnCacheTagHeader,
  ) {
    this._tags = []
    this._control = new CacheControl()
    this._customDirectives = new Map()
  }

  /**
   * Add the cache control and cache tags header to the event.
   *
   * The method is already called when using useCDNHeaders(), so there is no
   * need to call it yourself in this case.
   *
   * @param event - The event.
   */
  public applyToEvent(event: H3Event): NuxtMultiCacheCDNHelper {
    const cacheTagsValue = this._tags.filter(onlyUnique).join(' ')
    if (cacheTagsValue) {
      setResponseHeader(event, this.cacheTagsHeader, cacheTagsValue)
    }

    const cacheControlValue = [
      this.formatControl(),
      ...this._customDirectives.values(),
    ]
      .filter(Boolean)
      .join(', ')
    if (cacheControlValue) {
      setResponseHeader(event, this.cacheControlHeader, cacheControlValue)
    }

    return this
  }

  /**
   * Format the standard directives.
   *
   * Shared caches use s-maxage instead of max-age. Like max-age, the s-maxage
   * is the lowest of all sources, where a source without an s-maxage counts
   * with its max age: The app's own values, merged responses and bubbled
   * items. Otherwise a page with max-age=0 that merges s-maxage=3600 from an
   * API route would be cached for an hour. If no source has an s-maxage,
   * max-age applies to shared caches as well, so none is added.
   */
  private formatControl(): string {
    const ownSharedMaxAge = this._control.sharedMaxAge
    if (ownSharedMaxAge === null && !this._hasMergedSharedMaxAge) {
      return this._control.format()
    }

    const values = [
      ownSharedMaxAge ?? this._ownMaxAge,
      this._mergedSharedMaxAge,
    ].filter((v) => typeof v === 'number')
    this._control.sharedMaxAge = values.length ? Math.min(...values) : null
    const formatted = this._control.format()
    this._control.sharedMaxAge = ownSharedMaxAge
    return formatted
  }

  /**
   * Merge a max age and s-maxage that are not the app's own: From another
   * response or bubbled from a cached item. See formatControl().
   */
  private mergeMaxAge(
    providedMaxAge: MaxAge | null,
    providedSharedMaxAge: MaxAge | null = null,
  ) {
    const maxAge =
      providedMaxAge === null ? null : parseMaxAge(providedMaxAge, this.now)
    if (maxAge !== null && maxAge !== CACHE_PERMANENT) {
      this._control.maxAge = lowest(this._control.maxAge, maxAge)
    }

    const sharedMaxAge =
      providedSharedMaxAge === null
        ? maxAge
        : parseMaxAge(providedSharedMaxAge, this.now)
    if (providedSharedMaxAge !== null) {
      this._hasMergedSharedMaxAge = true
    }
    if (sharedMaxAge !== null && sharedMaxAge !== CACHE_PERMANENT) {
      this._mergedSharedMaxAge = lowest(this._mergedSharedMaxAge, sharedMaxAge)
    }
  }

  /**
   * Merge the cacheability from a fetch response.
   */
  public mergeFromResponse(arg: FetchResponse<any>): NuxtMultiCacheCDNHelper {
    const tagsHeaderValue = arg.headers.get(this.cacheTagsHeader)
    if (tagsHeaderValue) {
      const tags = tagsHeaderValue.split(' ').filter(Boolean)
      this._tags.push(...tags)
    }

    const controlHeaderValue = arg.headers.get(this.cacheControlHeader)

    if (controlHeaderValue) {
      this.mergeCacheControlHeader(controlHeaderValue)
    }

    return this
  }

  /**
   * Merge from a cache-control header.
   *
   * @param header - The value of the cache-control header.
   */
  public mergeCacheControlHeader(header: string): NuxtMultiCacheCDNHelper {
    const parsed = parse(header)

    if (parsed.private) {
      this.private()
    }

    for (const prop of numericProperties) {
      if (prop === 'maxAge' || prop === 'sharedMaxAge') {
        continue
      }
      if (typeof parsed[prop] === 'number') {
        this.setNumeric(prop, parsed[prop])
      }
    }

    if (
      typeof parsed.maxAge === 'number' ||
      typeof parsed.sharedMaxAge === 'number'
    ) {
      this.mergeMaxAge(parsed.maxAge, parsed.sharedMaxAge)
    }

    for (const prop of booleanProperties) {
      if (parsed[prop] === true) {
        this.setBoolean(prop)
      }
    }

    return this
  }

  /**
   * Set a cache-control property.
   */
  public set<T extends CacheControlProperties>(
    key: T,
    value: CacheControl[T],
  ): NuxtMultiCacheCDNHelper {
    this._control[key] = value
    if (key === 'maxAge') {
      this._ownMaxAge = typeof value === 'number' ? value : null
    }
    return this
  }

  /**
   * Add cache tags.
   */
  public addTags(tags?: string | string[]): NuxtMultiCacheCDNHelper {
    if (Array.isArray(tags)) {
      this._tags.push(...tags)
    } else if (typeof tags === 'string') {
      this._tags.push(tags)
    }
    return this
  }

  /**
   * Sets a numeric value only if it's lower than the current value or if it
   * isn't yet set.
   *
   * For example, this can be used when setting maxAge: You can set a global
   * max age of 1 year for every response. But a component down the tree that
   * shows the current weather can set it to 1 hour. If another component tries
   * to set the max age to 7 days the value won't be set.
   *
   * This basically means that the lowest value will always "win".
   *
   * A permanent value (`'permanent'` or -1) means "no limit", so it neither
   * sets nor lowers the directive.
   */
  public setNumeric<T extends CacheControlNumericProperties>(
    key: T,
    providedValue: MaxAge,
  ): NuxtMultiCacheCDNHelper {
    const currentValue = this._control[key]
    const value = parseMaxAge(providedValue, this.now)
    if (value === CACHE_PERMANENT) {
      return this
    }

    if (
      currentValue === null ||
      currentValue === undefined ||
      value < currentValue
    ) {
      this._control[key] = value
    }
    if (key === 'maxAge') {
      this._ownMaxAge = lowest(this._ownMaxAge, value)
    }
    return this
  }

  /**
   * Sets a boolean value to true.
   */
  public setBoolean<T extends CacheControlBooleanProperties>(
    key: T,
  ): NuxtMultiCacheCDNHelper {
    this._control[key] = true
    return this
  }

  /**
   * Add a custom cache-control directive that is not part of the standard
   * Cache-Control specification. For example, some CDN providers support
   * proprietary directives like `durable`.
   *
   * Pass `true` as the value for a boolean (valueless) directive, or a string
   * or number for a directive with a value.
   *
   * Directive names are case-insensitive and are added in lowercase. Adding
   * the same directive again replaces its value. Strings that are not a valid
   * token are added as a quoted string and numbers are rounded down.
   *
   * Standard directives such as `public` or `max-age`, invalid names and
   * values that can't be represented in a header (such as negative numbers or
   * strings containing line breaks) are skipped and a warning is logged.
   *
   * @param name - The directive name.
   * @param value - The directive value. Use `true` for a valueless directive.
   */
  public addCustomDirective(
    name: string,
    value: string | number | true = true,
  ): NuxtMultiCacheCDNHelper {
    const key = name.toLowerCase()

    if (!tokenRegex.test(key)) {
      logger.warn(
        `Skipped custom directive ${JSON.stringify(name)}: Not a valid directive name.`,
      )
      return this
    }

    if (standardDirectives.has(key)) {
      logger.warn(
        `Skipped custom directive "${key}": Standard directives can't be added as custom directives. Use set(), setNumeric(), setBoolean(), public() or private() instead.`,
      )
      return this
    }

    const directive = formatCustomDirective(key, value)
    if (directive === null) {
      logger.warn(
        `Skipped custom directive "${key}": Invalid value ${typeof value === 'string' ? JSON.stringify(value) : String(value)}.`,
      )
      return this
    }

    this._customDirectives.set(key, directive)
    return this
  }

  /**
   * Set as private.
   *
   * Note that once it's set to private you can't change it back to public.
   * This is so that it's possible to change it at any time during the request
   * without running into race conditions.
   */
  public private(): NuxtMultiCacheCDNHelper {
    this._control.private = true
    this._control.public = false
    return this
  }

  /**
   * Set public.
   *
   * Note that if `private` was already set to `true` this will have no effect.
   */
  public public(): NuxtMultiCacheCDNHelper {
    if (!this._control.private) {
      this._control.public = true
    }
    return this
  }

  public mergeFromCacheItem(
    item: CacheableItemInterface,
  ): NuxtMultiCacheCDNHelper {
    if (item.cacheTags) {
      this.addTags(item.cacheTags)
    }

    if (item.expires !== null && item.expires !== undefined) {
      this.mergeMaxAge(expiresToMaxAge(item.expires, this.now))
    }
    if (
      item.staleIfErrorExpires !== null &&
      item.staleIfErrorExpires !== undefined
    ) {
      // Items without stale-if-error are stored with 0, so 0 must not lower
      // the current value.
      const staleIfError = expiresToMaxAge(item.staleIfErrorExpires, this.now)
      if (staleIfError !== CACHE_NEVER) {
        this.setNumeric('staleIfError', staleIfError)
      }
    }

    return this
  }

  public mergeFromCacheability(
    cacheability: CacheabilityInterface,
  ): NuxtMultiCacheCDNHelper {
    const maxAge = cacheability.getMaxAge()
    if (maxAge !== null) {
      this.mergeMaxAge(maxAge)
    }

    // Like in mergeFromCacheItem(), a stale-if-error of 0 doesn't lower the
    // current value.
    const staleIfError = cacheability.getStaleIfError()
    if (staleIfError !== null && staleIfError !== CACHE_NEVER) {
      this.setNumeric('staleIfError', staleIfError)
    }

    this.addTags(cacheability.getTags())

    // Something that is not cacheable must not be stored by the CDN either. A
    // max age of 0 alone would still allow storing the response or serving it
    // stale. It also lowers an s-maxage to 0, see formatControl().
    if (cacheability.getCacheable() === false) {
      this.mergeMaxAge(0)
      this.setBoolean('noStore')
    }

    return this
  }

  public getMaxAge(): number | null {
    return this._control.maxAge
  }

  public getStaleIfError(): number | null {
    return this._control.staleIfError
  }

  public getTags(): string[] {
    return this._tags
  }

  /**
   * The CDN helper doesn't track whether the response is cacheable.
   */
  public getCacheable(): boolean | null {
    return null
  }
}
