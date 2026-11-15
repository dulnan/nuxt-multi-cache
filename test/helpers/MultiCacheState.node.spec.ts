import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MultiCacheState,
  RENDER_TIMEOUT,
  REVALIDATION_TIMEOUT,
} from '../../src/runtime/helpers/MultiCacheState'

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

    const release = state.startRender('foo')
    expect(release).toBeTypeOf('function')
    expect(state.startRender('foo')).toBeNull()
    expect(state.startRender('bar')).toBeTypeOf('function')

    release!()
    expect(state.startRender('foo')).toBeTypeOf('function')
  })

  test('Resolves waiting callers when the render is released.', async () => {
    const state = new MultiCacheState()
    const release = state.startRender('foo')!

    let waited = false
    const waiting = state.waitForRender('foo').then(() => {
      waited = true
    })

    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT / 2)
    expect(waited).toBe(false)

    release()
    await waiting
    expect(waited).toBe(true)
  })

  test('Resolves waiting callers after the timeout.', async () => {
    const state = new MultiCacheState()
    state.startRender('foo')

    let waited = false
    const waiting = state.waitForRender('foo').then(() => {
      waited = true
    })

    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT - 1)
    expect(waited).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await waiting
    expect(waited).toBe(true)
  })

  test('Resolves at once if the key is not being rendered.', async () => {
    const state = new MultiCacheState()
    await expect(state.waitForRender('foo')).resolves.toBeUndefined()
  })

  test('Lets a new caller render a key after the timeout.', () => {
    const state = new MultiCacheState()
    const releaseOld = state.startRender('foo')!

    vi.advanceTimersByTime(RENDER_TIMEOUT)
    expect(state.startRender('foo')).toBeNull()

    vi.advanceTimersByTime(1)
    const releaseNew = state.startRender('foo')
    expect(releaseNew).toBeTypeOf('function')

    // Releasing the old render doesn't end the new one.
    releaseOld()
    expect(state.startRender('foo')).toBeNull()
  })
})
