---
layout: home

title: Nuxt Multi Cache для Nuxt

hero:
  name: Продвинутое кеширование для Nuxt
  tagline:
    Бесшовное кеширование компонентов, маршрутов и данных. Динамическое
    определение заголовков управления CDN кешем. Предоставляет API управления
    кешем для очистки элементов по ключу или с использованием cache tags.
  image:
    src: /nuxt-multi-cache.svg
    alt: nuxt-multi-cache
  actions:
    - theme: brand
      text: Начать
      link: /ru/overview/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/dulnan/nuxt-multi-cache

features:
  - title: Component Cache
    icon: ⚡
    details:
      Кешируйте отрендеренную разметку компонентов для значительного
      сокращения времени серверного рендеринга страниц.
  - title: Route Cache
    icon: 📑
    details:
      Кешируйте полный ответ страниц или пользовательских API маршрутов,
      включая заголовки.
  - title: Data Cache
    icon: 💾
    details:
      Универсальный composable для кеширования любых данных, таких как ответы
      внешних API или тяжелые вычисления.
  - title: CDN Headers
    icon: 🌎
    details:
      Управляйте Cache-Control или Cache-Tag HTTP заголовками для кешей типа
      Cloudflare, Fastly или Varnish.
---
