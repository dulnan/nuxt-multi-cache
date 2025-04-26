export type AddToCacheMethod<T> = (
  data: T,
  tags?: string[],
  maxAge?: number,
) => Promise<void>

export type CallbackContext<T> = {
  addToCache: AddToCacheMethod<T>
  value?: T
  cacheTags: string[]
  expires?: number
}
