import { useDataCache } from '#imports'

const testData = {
  value: 'Hello World',
}

export async function useData(): Promise<{ value: string }> {
  const { value, addToCache } = await useDataCache('foobar', null, {
    bubbleCacheability: true,
  })

  if (!value) {
    await addToCache(testData, ['tag-from-data-cache'], 1000, 1000)
  }

  return testData
}
