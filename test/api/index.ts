export default {
  getMenu() {
    return new Promise((resolve) => {
      const links = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'].map((slug) => {
        return {
          slug,
          label: slug,
          random: Math.round(Math.random() * 10000000000).toString(),
        }
      })
      resolve(links)
    })
  },
}
