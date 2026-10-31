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

Depending on your project this can significantly improve the time it takes to
generate pages.

::: warning

`<RenderCacheable>` is meant for parts of a page, not for entire pages (for
example by wrapping `<NuxtPage>` in a layout). A page returned from the
component cache is missing everything that its components add outside of their
markup: Head tags set with `useHead()` (such as the `<title>`) are not rendered,
and the data of `useAsyncData()` is missing from the payload, which leads to a
hydration mismatch on the client.

:::

The benefits are noticeable the more pages and complex components you have. This
means the benefits will be barely noticeable if you only have 50 pages.
