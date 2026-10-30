import { describe, expect, test } from 'vitest'
import { Fragment, defineComponent, h } from 'vue'
import { createStorage } from 'unstorage'
import { encodeComponentCacheItem } from '../../../src/runtime/helpers/cacheItem'
import {
  getCacheKey,
  getComponentName,
  getCachedComponent,
  getSlotVNode,
} from './../../../src/runtime/components/RenderCacheable/server/helper'

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

  test('Derives cache key using hashed component props.', () => {
    expect(
      getCacheKey({}, {
        type: { name: 'MyComponent' },
        props: { hello: 'one' },
      } as any),
    ).toMatchInlineSnapshot(
      `"MyComponent::AKu9ti69MYahEcv8PwEZFe0Ycb8YyUY_-RWGnNH8zws"`,
    )
  })
})

describe('getSlotVNode', () => {
  const Inner = defineComponent({ name: 'Inner', render: () => null })

  test('Returns the first vnode of the slot.', () => {
    const inner = h(Inner)
    expect(getSlotVNode({}, [inner, h('div')])).toBe(inner)
  })

  test('Returns the first child of a forwarded slot if a cache key is provided.', () => {
    const inner = h(Inner)
    expect(getSlotVNode({ cacheKey: 'foo' }, [h(Fragment, [inner])])).toBe(
      inner,
    )
  })

  test('Returns the first child of a slot that was forwarded twice.', () => {
    const inner = h(Inner)
    expect(
      getSlotVNode({ cacheKey: 'foo' }, [h(Fragment, [h(Fragment, [inner])])]),
    ).toBe(inner)
  })

  test('Returns nothing for a forwarded slot without a cache key.', () => {
    expect(getSlotVNode({}, [h(Fragment, [h(Inner)])])).toBeUndefined()
  })

  test('Returns nothing for an empty slot.', () => {
    expect(getSlotVNode({}, [])).toBeUndefined()
    expect(getSlotVNode({ cacheKey: 'foo' }, [h(Fragment, [])])).toBeUndefined()
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
    storage.setItemRaw('foobar', encodeComponentCacheItem('<div></div>'))
    const item = await getCachedComponent(storage, 'foobar')
    expect(item).toEqual({
      data: '<div></div>',
      expires: -1,
      staleIfErrorExpires: 0,
    })
  })
})
