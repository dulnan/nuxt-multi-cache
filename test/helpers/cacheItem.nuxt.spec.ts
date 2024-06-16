import { describe, expect, test } from 'vitest'
import {
  encodeRouteCacheItem,
  decodeRouteCacheItem,
} from '../../src/runtime/helpers/cacheItem'

describe('cacheItem helpers', () => {
  test('encodeRouteCacheitem', () => {
    expect(
      encodeRouteCacheItem('<html></html>', {}, 200, undefined, []),
    ).toEqual(
      `{"headers":{},"statusCode":200,"cacheTags":[]}<CACHE_ITEM><html></html>`,
    )

    expect(
      encodeRouteCacheItem(
        '<html></html>',
        {
          'Accept-Language': 'de, en',
          'Cache-Control': 'private',
        },
        200,
        undefined,
        [],
      ),
    ).toEqual(
      `{"headers":{"Accept-Language":"de, en","Cache-Control":"private"},"statusCode":200,"cacheTags":[]}<CACHE_ITEM><html></html>`,
    )

    expect(
      encodeRouteCacheItem(
        '<html></html>',
        {
          'Accept-Language': 'de, en',
          'Cache-Control': 'private',
        },
        200,
        5000,
        ['my_tag1', 'my_tag2'],
      ),
    ).toEqual(
      `{"headers":{"Accept-Language":"de, en","Cache-Control":"private"},"statusCode":200,"expires":5000,"cacheTags":["my_tag1","my_tag2"]}<CACHE_ITEM><html></html>`,
    )
  })

  test('decodeRouteCacheItem', () => {
    expect(
      decodeRouteCacheItem(
        `{"headers":{},"statusCode":200,"cacheTags":[]}<CACHE_ITEM><html></html>`,
      ),
    ).toEqual({
      data: '<html></html>',
      cacheTags: [],
      headers: {},
      statusCode: 200,
    })

    expect(
      decodeRouteCacheItem(
        `{"headers":{"Accept-Language": "de"},"statusCode":301,"cacheTags":["my_tag"]}<CACHE_ITEM><html></html>`,
      ),
    ).toEqual({
      data: '<html></html>',
      cacheTags: ['my_tag'],
      headers: {
        'Accept-Language': 'de',
      },
      statusCode: 301,
    })
  })
})
