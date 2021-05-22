export default {
  get(_value: string, cb?: (res?: string) => void) {
    if (cb) {
      cb()
      return
    }
  },

  set(_value: string, _data: any) {
    return
  },

  has(_value: string, cb: (hit: boolean) => void) {
    if (cb) {
      return cb(false)
    }
    return false
  }
}
