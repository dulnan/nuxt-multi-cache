import { CacheControl, parse } from '@tusbar/cache-control'
import { setResponseHeader, type H3Event } from 'h3'
import type { FetchResponse } from 'ofetch'
import { onlyUnique } from './server'
import { expiresToMaxAge, parseMaxAge, type MaxAge } from './maxAge'
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
  constructor(
    private readonly now: number,
    public readonly cacheControlHeader = cdnCacheControlHeader,
    public readonly cacheTagsHeader = cdnCacheTagHeader,
  ) {
    this._tags = []
    this._control = new CacheControl()
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

    const cacheControlValue = this._control.format()
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
