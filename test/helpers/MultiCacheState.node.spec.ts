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

  test('Lets waiting requests continue when the render ends.', async () => {
    const state = new MultiCacheState()
    const end = state.startRender('foo')!
    expect(state.startRender('foo')).toBeUndefined()

    let waited: boolean | undefined
    const waiting = state.waitForRender('foo').then((result) => {
      waited = result
    })
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT / 2)
    expect(waited).toBeUndefined()

    end()
    await waiting
    expect(waited).toBe(true)
    expect(await state.waitForRender('foo')).toBe(false)
    expect(state.startRender('foo')).toBeTypeOf('function')
  })

  test('Ends a render that never ends after the timeout.', async () => {
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
    expect(state.startRender('foo')).toBeTypeOf('function')
  })
})
