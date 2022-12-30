import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import {
  getCacheKey,
  getComponentName,
  getCachedComponent,
} from './../../../src/runtime/components/RenderCacheable/helpers/index'

const consoleSpy = vi.spyOn(global.console, 'debug')

describe('getCacheKey', () => {
  test('Returns no cache key if component has no name.', () => {
    expect(getCacheKey({}, {} as any)).toBeUndefined()
  })

  test('Returns component name as key if there is no custom key or props.', () => {
    expect(getCacheKey({}, { type: { name: 'MyComponent' } } as any)).toEqual(
      'MyComponent',
    )
  })

  test('Uses component name as part of the cache key.', () => {
    expect(
      getCacheKey({ cacheKey: 'foobar' }, {
        type: { name: 'MyComponent' },
      } as any),
    ).toEqual('MyComponent::foobar')
  })

  test('Returns cache key provided via props.', () => {
    expect(
      getCacheKey({ cacheKey: 'foobar' }, { type: { name: 'Foobar' } } as any),
    ).toEqual('Foobar::foobar')
  })

  test('Logs a warning to the console if no cache key could be derived.', () => {
    getCacheKey({ cacheKey: 'foobar' }, {} as any)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Skipped caching component because component has no name.',
    )
  })

  test('Derives cache key using hashed component props.', () => {
    expect(
      getCacheKey({}, {
        type: { name: 'MyComponent' },
        props: { hello: 'one' },
      } as any),
    ).toMatchInlineSnapshot('"MyComponent::voBC1hkg5S"')
  })
})

describe('getComponentName', () => {
  test('Returns undefined if component has no name.', () => {
    expect(getComponentName({} as any)).toBeUndefined()
  })

  test('Returns explicit name.', () => {
    expect(getComponentName({ type: { name: 'MyComponent' } } as any)).toEqual(
      'MyComponent',
    )
  })

  test('Returns name derived from file name.', () => {
    expect(
      getComponentName({ type: { __name: 'MyComponent' } } as any),
    ).toEqual('MyComponent')
  })

  test('Returns undefined if vnode is not a component.', () => {
    expect(getComponentName({ type: 'div' } as any)).toBeUndefined()
  })
})

describe('getCachedComponent', () => {
  test('Returns undefined if no cached component is available.', async () => {
    const storage = createStorage()
    const item = await getCachedComponent(storage, 'foobar')
    expect(item).toBeUndefined()
  })

  test('Returns cached component.', async () => {
    const storage = createStorage()
    storage.setItem('foobar', { data: '<div></div>' })
    const item = await getCachedComponent(storage, 'foobar')
    expect(item).toEqual({ data: '<div></div>' })
  })

  test('Returns cached string component.', async () => {
    const storage = createStorage()
    storage.setItem('foobar', '<div></div>')
    const item = await getCachedComponent(storage, 'foobar')
    expect(item).toEqual({ data: '<div></div>' })
  })
})
