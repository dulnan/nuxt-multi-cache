import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MAX_KEYS_NOT_STORED,
  MultiCacheState,
  NOT_STORED_TIMEOUT,
  REVALIDATION_TIMEOUT,
} from '../../src/runtime/helpers/MultiCacheState'

// The timeout of a render, in milliseconds.
const TIMEOUT = 1_000

describe('MultiCacheState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Marks a key as being revalidated until it is removed.', () => {
    const state = new MultiCacheState()
    expect(state.isBeingRevalidated('foo')).toBe(false)

    state.addKeyBeingRevalidated('foo')
    expect(state.isBeingRevalidated('foo')).toBe(true)
    expect(state.isBeingRevalidated('bar')).toBe(false)

    state.removeKeyBeingRevalidated('foo')
    expect(state.isBeingRevalidated('foo')).toBe(false)
  })

  test('No longer counts a key as being revalidated after the timeout.', () => {
    const state = new MultiCacheState()
    state.addKeyBeingRevalidated('foo')

    vi.advanceTimersByTime(REVALIDATION_TIMEOUT)
    expect(state.isBeingRevalidated('foo')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(state.isBeingRevalidated('foo')).toBe(false)

    // A new revalidation can start.
    state.addKeyBeingRevalidated('foo')
    expect(state.isBeingRevalidated('foo')).toBe(true)
  })
})

describe('MultiCacheState renders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Lets only one caller render a key at a time.', () => {
    const state = new MultiCacheState()

    const release = state.startRender('foo', TIMEOUT)
    expect(release).toBeTypeOf('function')
    expect(state.startRender('foo', TIMEOUT)).toBeNull()
    expect(state.startRender('bar', TIMEOUT)).toBeTypeOf('function')

    release!(true)
    expect(state.startRender('foo', TIMEOUT)).toBeTypeOf('function')
  })

  test('Resolves waiting callers when the render is released.', async () => {
    const state = new MultiCacheState()
    const release = state.startRender('foo', TIMEOUT)!

    let waited = false
    const waiting = state.waitForRender('foo', TIMEOUT).then(() => {
      waited = true
    })

    await vi.advanceTimersByTimeAsync(TIMEOUT / 2)
    expect(waited).toBe(false)

    release(true)
    await waiting
    expect(waited).toBe(true)
  })

  test('Resolves waiting callers after the timeout.', async () => {
    const state = new MultiCacheState()
    state.startRender('foo', TIMEOUT)

    let waited = false
    const waiting = state.waitForRender('foo', TIMEOUT).then(() => {
      waited = true
    })

    await vi.advanceTimersByTimeAsync(TIMEOUT - 1)
    expect(waited).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await waiting
    expect(waited).toBe(true)
  })

  test('Resolves at once if the key is not being rendered.', async () => {
    const state = new MultiCacheState()
    await expect(state.waitForRender('foo', TIMEOUT)).resolves.toBeUndefined()
  })

  test('Lets a new caller render a key after the timeout.', () => {
    const state = new MultiCacheState()
    const releaseOld = state.startRender('foo', TIMEOUT)!

    vi.advanceTimersByTime(TIMEOUT)
    expect(state.startRender('foo', TIMEOUT)).toBeNull()

    vi.advanceTimersByTime(1)
    const releaseNew = state.startRender('foo', TIMEOUT)
    expect(releaseNew).toBeTypeOf('function')

    // Releasing the old render doesn't end the new one.
    releaseOld(false)
    expect(state.startRender('foo', TIMEOUT)).toBeNull()
  })

  test('Remembers a key whose render stored nothing, until the timeout.', () => {
    const state = new MultiCacheState()

    state.startRender('foo', TIMEOUT)!(false)
    expect(state.wasNotStored('foo')).toBe(true)
    expect(state.wasNotStored('bar')).toBe(false)

    vi.advanceTimersByTime(NOT_STORED_TIMEOUT)
    expect(state.wasNotStored('foo')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(state.wasNotStored('foo')).toBe(false)
  })

  test('Starts the time again for each render that stores nothing.', () => {
    const state = new MultiCacheState()

    state.startRender('foo', TIMEOUT)!(false)
    vi.advanceTimersByTime(NOT_STORED_TIMEOUT)
    state.startRender('foo', TIMEOUT)!(false)

    vi.advanceTimersByTime(1)
    expect(state.wasNotStored('foo')).toBe(true)
  })

  test('Forgets a key once a render of it is stored.', () => {
    const state = new MultiCacheState()

    state.startRender('foo', TIMEOUT)!(false)
    state.startRender('foo', TIMEOUT)!(true)

    expect(state.wasNotStored('foo')).toBe(false)
  })

  test('Remembers a key whose render timed out.', () => {
    const state = new MultiCacheState()

    state.startRender('foo', TIMEOUT)
    vi.advanceTimersByTime(TIMEOUT + 1)
    expect(state.wasNotStored('foo')).toBe(false)

    // The next request replaces the render that timed out.
    expect(state.startRender('foo', TIMEOUT)).toBeTypeOf('function')
    expect(state.wasNotStored('foo')).toBe(true)
  })

  test('Keeps the keys that were added last.', () => {
    const state = new MultiCacheState()

    for (let i = 0; i < MAX_KEYS_NOT_STORED; i++) {
      state.addKeyNotStored(`key-${i}`)
    }
    // Added again, so it's the newest key.
    state.addKeyNotStored('key-0')
    state.addKeyNotStored('new')

    expect(state.keysNotStored.size).toBe(MAX_KEYS_NOT_STORED)
    expect(state.wasNotStored('key-0')).toBe(true)
    expect(state.wasNotStored('key-1')).toBe(false)
    expect(state.wasNotStored('key-2')).toBe(true)
    expect(state.wasNotStored('new')).toBe(true)
  })
})
