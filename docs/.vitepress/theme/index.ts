// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  ...DefaultTheme,
  // Layout() {
  //   return h(DefaultTheme.Layout, null, {
  //     'home-hero-after': () => h(HeroIllustration),
  //   })
  // },
}
