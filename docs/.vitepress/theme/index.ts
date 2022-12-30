// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {},
  // Layout() {
  //   return h(DefaultTheme.Layout, null, {
  //     'home-hero-after': () => h(HeroIllustration),
  //   })
  // },
}
