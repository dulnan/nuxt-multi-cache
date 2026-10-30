import { CacheControl, parse } from '@tusbar/cache-control'
import { setResponseHeader, type H3Event } from 'h3'
import type { FetchResponse } from 'ofetch'
import { onlyUnique } from './server'
import { expiresToMaxAge, parseMaxAge, type MaxAge } from './maxAge'
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
      this._control.format(),
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
   * Merge the cacheability from a fetch response.
   */
  public mergeFromResponse(arg: FetchResponse<any>): NuxtMultiCacheCDNHelper {
    const tagsHeaderValue = arg.headers.get(this.cacheTagsHeader)
    if (tagsHeaderValue) {
      const tags = tagsHeaderValue.split(' ')
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
      if (typeof parsed[prop] === 'number') {
        this.setNumeric(prop, parsed[prop])
      }
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
   */
  public setNumeric<T extends CacheControlNumericProperties>(
    key: T,
    providedValue: MaxAge,
  ): NuxtMultiCacheCDNHelper {
    const currentValue = this._control[key]
    const value = parseMaxAge(providedValue, this.now)
    if (
      currentValue === null ||
      currentValue === undefined ||
      value < currentValue
    ) {
      this._control[key] = value
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
      this.setNumeric('maxAge', expiresToMaxAge(item.expires, this.now))
    }
    if (
      item.staleIfErrorExpires !== null &&
      item.staleIfErrorExpires !== undefined
    ) {
      this.setNumeric(
        'staleIfError',
        expiresToMaxAge(item.staleIfErrorExpires, this.now),
      )
    }

    return this
  }

  public mergeFromCacheability(
    cacheability: CacheabilityInterface,
  ): NuxtMultiCacheCDNHelper {
    const maxAge = cacheability.getMaxAge()
    if (maxAge !== null) {
      this.setNumeric('maxAge', maxAge)
    }

    const staleIfError = cacheability.getStaleIfError()
    if (staleIfError !== null) {
      this.setNumeric('staleIfError', staleIfError)
    }

    this.addTags(cacheability.getTags())
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
}
