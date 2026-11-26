import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MAX_KEYS_NOT_STORED,
  MultiCacheState,
  NOT_STORED_TIMEOUT,
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
  const TIMEOUT = 5_000

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function isWaiting(promise: Promise<unknown>) {
    let waiting = true
    promise.then(() => (waiting = false))
    await vi.advanceTimersByTimeAsync(0)
    return waiting
  }

  test('Lets requests wait once for the render, until it ends.', async () => {
    const state = new MultiCacheState()
    const end = await state.waitOrStartRender('foo', TIMEOUT)
    const waiting = state.waitOrStartRender('foo', TIMEOUT)

    await vi.advanceTimersByTimeAsync(TIMEOUT - 1)
    expect(await isWaiting(waiting)).toBe(true)
    end!(true)
    expect(await waiting).toBeUndefined()
    expect(await state.waitOrStartRender('foo', TIMEOUT)).toBeTypeOf('function')
  })

  test('Ends a render after the timeout.', async () => {
    const state = new MultiCacheState()
    await state.waitOrStartRender('foo', 15_000)
    const waiting = state.waitOrStartRender('foo', 15_000)

    await vi.advanceTimersByTimeAsync(15_000 - 1)
    expect(await isWaiting(waiting)).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(await isWaiting(waiting)).toBe(false)
    expect(await state.waitOrStartRender('foo', 15_000)).toBeTypeOf('function')
  })

  test('Lets requests not wait for 60 seconds after a render stored nothing.', async () => {
    const state = new MultiCacheState()
    const first = await state.waitOrStartRender('foo', TIMEOUT)
    first!(false)

    // The next request still renders the key, so that its result decides.
    const end = await state.waitOrStartRender('foo', 2 * NOT_STORED_TIMEOUT)
    expect(end).toBeTypeOf('function')
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(false)

    await vi.advanceTimersByTimeAsync(NOT_STORED_TIMEOUT - 1)
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(true)

    // Each render that stores nothing starts the 60 seconds again.
    end!(false)
    await state.waitOrStartRender('foo', TIMEOUT)
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(false)
  })

  test('Lets requests wait again after a render stored the route.', async () => {
    const state = new MultiCacheState()
    const first = await state.waitOrStartRender('foo', TIMEOUT)
    first!(false)
    const second = await state.waitOrStartRender('foo', TIMEOUT)
    second!(true)

    await state.waitOrStartRender('foo', TIMEOUT)
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(true)
  })

  test('Counts a render that timed out as storing nothing.', async () => {
    const state = new MultiCacheState()
    await state.waitOrStartRender('foo', TIMEOUT)
    await vi.advanceTimersByTimeAsync(TIMEOUT)

    await state.waitOrStartRender('foo', TIMEOUT)
    expect(await isWaiting(state.waitOrStartRender('foo', TIMEOUT))).toBe(false)
  })

  test('Forgets all keys whose render stored nothing at the limit.', async () => {
    const state = new MultiCacheState()
    for (let i = 0; i < MAX_KEYS_NOT_STORED; i++) {
      const end = await state.waitOrStartRender(`key${i}`, TIMEOUT)
      end!(false)
    }
    await state.waitOrStartRender('key0', TIMEOUT)
    expect(await isWaiting(state.waitOrStartRender('key0', TIMEOUT))).toBe(
      false,
    )

    const end = await state.waitOrStartRender('new', TIMEOUT)
    end!(false)
    expect(await isWaiting(state.waitOrStartRender('key0', TIMEOUT))).toBe(true)
    await state.waitOrStartRender('new', TIMEOUT)
    expect(await isWaiting(state.waitOrStartRender('new', TIMEOUT))).toBe(false)
  })
})
