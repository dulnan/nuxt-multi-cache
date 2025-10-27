# Documentation Multilingual Support

## Structure

The documentation supports multiple languages:

- **English (default)**: files in the root `docs/`
- **Russian**: files in the `docs/ru/` folder

## Folder Structure

```
docs/
├── .vitepress/
│   └── config.ts          # Configuration with settings for all languages
├── index.md               # Homepage (EN)
├── overview/              # Documentation (EN)
├── features/              # Documentation (EN)
├── composables/           # Documentation (EN)
├── use-cases/             # Documentation (EN)
├── advanced/              # Documentation (EN)
└── ru/                    # Russian version
    ├── index.md           # Homepage (RU)
    ├── overview/          # Documentation (RU)
    ├── features/          # Documentation (RU)
    ├── composables/       # Documentation (RU)
    ├── use-cases/         # Documentation (RU)
    └── advanced/          # Documentation (RU)
```

## URL Structure

- English version: `https://nuxt-multi-cache.dulnan.net/` or `https://nuxt-multi-cache.dulnan.net/overview/introduction`
- Russian version: `https://nuxt-multi-cache.dulnan.net/ru/` or `https://nuxt-multi-cache.dulnan.net/ru/overview/introduction`

## Adding a New Language

1. Create a folder for the new language in `docs/`, for example `docs/fr/`
2. Copy the file structure from the English version
3. Update `docs/.vitepress/config.ts`:
   - Add a new locale to the `locales` section
   - Create a sidebar function (e.g. `getFrSidebar()`)
   - Add VitePress interface translations

Example of adding French language:

```typescript
locales: {
  root: { /* English */ },
  ru: { /* Russian */ },
  fr: {
    label: 'Français',
    lang: 'fr-FR',
    description: 'Cache de composants, routes et données pour Nuxt 3.',
    themeConfig: {
      // ... navigation and sidebar configuration
    }
  }
}
```

## Running Documentation Locally

```bash
npm run docs:dev
```

The documentation will be available at `http://localhost:5000`

The language switcher will appear automatically in the top right corner of the navigation.

## Translating Documentation

Files in the `docs/ru/` folder are copies of the English version. To translate:

1. Open the corresponding file in `docs/ru/`
2. Translate the content into Russian
3. Update links (if they point to English pages, replace `/` with `/ru/`)
4. Check the result locally via `npm run docs:dev`

## Important

- Folder structure and file names must match for all languages
- When adding a new page, remember to add it to all language versions
- Links within the documentation should point to pages in the same language

