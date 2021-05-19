/**
 * Helper method to build the component cache key, including cache tags.
 */
function getServerCacheKey(key, tags = []) {
  if (key === false || !Array.isArray(tags)) {
    return false
  }

  return key + '____' + tags.join('$')
}

module.exports = { getServerCacheKey }
