import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MultiCacheState,
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
