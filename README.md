# React App (migrated from Framer)

## Stack
- React 18 + Vite 5
- Tailwind CSS v3
- React Router v6 (lang-prefixed routes: /de, /en, /fr, /it, /nl)
- react-i18next (translations)
- @directus/sdk (data source)
- PostgreSQL-backed auth + cabinet state via local API routes

## Detected from Framer export
- **Languages**: de, en, fr, it, nl
- **Pages**: home, blog
- **Collections**: agents, properties, blog_posts, leads
- **Components**: 176 extracted from HTML

## Features
✅ Real HTML extracted from Framer (not just stubs)
✅ Converted to proper React components
✅ CSS modules per component (from Framer styles)
✅ Directus integration for dynamic data
✅ i18n support for all languages
✅ React Router with language prefixes

## Getting started
```bash
npm install
npm run dev
```

Frontend local auth config lives in `.env.local`:

```bash
VITE_DIRECTUS_URL=...
VITE_DIRECTUS_TOKEN=...
VITE_MAPBOX_ACCESS_TOKEN=...
VITE_MAPBOX_STYLE_URL=mapbox://styles/mapbox/light-v11
```

Map search now uses Mapbox GL. `VITE_MAPBOX_ACCESS_TOKEN` is required for the live listing map on `/search`.

Backend automation runtime lives in `backend/` and now uses PostgreSQL directly.
Oracle bootstrap script:

```bash
backend/init_oracle_postgres.sh
```

## Workflow
1. Components have real Framer HTML inside
2. Customize components as needed
3. Connect Directus data hooks to sections
4. Deploy with `npm run build`

## Structure
```
src/
  api/directus.js       – Directus SDK
  hooks/useDirectus.js  – Data fetching
  i18n/                 – Translations
  components/           – Real Framer components + CSS modules
  pages/                – Page layouts
  App.jsx              – Routing
  main.jsx
```
