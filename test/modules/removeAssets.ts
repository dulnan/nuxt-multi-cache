import cheerio from 'cheerio'

export default function () {
  this.nuxt.hook('render:route', (route, result) => {
    const $ = cheerio.load(result.html)
    $('script').remove()
    $('link').remove()
    result.html = $.html()
    return result
  })
}
