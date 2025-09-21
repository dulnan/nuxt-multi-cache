# Improve performance of static site generation (SSG)

Even if you don't plan to run Nuxt as a server you can still use this module,
especially if you have a lot of pages.

When generating 5000 static pages, the only thing that usually changes is the
page content. Header, navigation and footer are mostly the same. By using the
[`<RenderCacheable>`](/features/component-cache) component you can cache the
rendered markup of a component. This means that when generating 5000 pages, the
navigation and footer is only generated once. After that the markup is directly
used.

If you use an external cache backend like Redis you can even cache these
components across multiple SSG executions.

It's also possible to use [`<RenderCacheable>`](/features/component-cache) to
cache the markup of entire pages when used inside a layout component. This means
that if you need to regenerate the pages you only have to generate the ones that
have actually changed.

Depending on your project this can significantly improve the time it takes to
generate pages.

The benefits are noticeable the more pages and complex components you have. This
means the benefits will be barely noticeable if you only have 50 pages.
