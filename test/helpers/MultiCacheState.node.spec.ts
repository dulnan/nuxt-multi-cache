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

  test('Lets requests wait once for the render, until it ends.', async () => {
    const state = new MultiCacheState()
    const end = await state.waitOrStartRender('foo')
    let waited = false
    const waiting = state.waitOrStartRender('foo').then((result) => {
      waited = true
      return result
    })

    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT - 1)
    expect(waited).toBe(false)
    end!()
    expect(await waiting).toBeUndefined()
    expect(await state.waitOrStartRender('foo')).toBeTypeOf('function')
  })

  test('Ends a render after the timeout.', async () => {
    const state = new MultiCacheState()
    await state.waitOrStartRender('foo')
    const waiting = state.waitOrStartRender('foo')

    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT)
    expect(await waiting).toBeUndefined()
    expect(await state.waitOrStartRender('foo')).toBeTypeOf('function')
  })
})
