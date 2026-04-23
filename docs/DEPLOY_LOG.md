# Book.immo Deployment Log

## What Broke

1. Framer export brought in runtime dependencies that were not fully local.
2. Vercel kept returning `404` for locale pages like `/de/`, even though the repo contained `index.html` and `de/index.html`.
3. The HTML referenced broken asset paths:
   - `/_local/cdn.framerauth.com/packages/sdk/live/latest/framerauth.js`
   - `/public/directus-bridge.js`
4. Directus API access returned `403` until permissions and token access were fixed.
5. After access worked, the CMS collections were still empty, so the front end rendered no content.

## What I Did, In Order

1. Replicated the Framer export into `bookimmo/` and kept all localized copies:
   - `de/`
   - `en/`
   - `fr/`
   - `it/`
   - `nl/`
2. Added localization routing attempts in `vercel.json` to handle `/de`, `/en`, `/fr`, `/it`, `/nl`.
3. Added a Directus proxy at `api/directus.js` so the browser would not talk to `cms.book.immo` directly.
4. Fixed Directus permissions on the server:
   - confirmed the `Public` role existed
   - confirmed read access for `agents`, `properties`, and `blog_posts`
   - added a static token for authenticated API access
5. Fixed the CMS CORS settings on the Directus host.
6. Found that Vercel still did not serve the static locale pages reliably, so I added an API fallback renderer:
   - `api/page.js`
7. Reworked the rendered HTML to avoid the broken Framer Auth include and keep the Directus bridge on the static public path:
   - removed `/_local/cdn.framerauth.com/.../framerauth.js`
   - kept `/public/directus-bridge.js`
8. Simplified and then reworked `vercel.json` several times while chasing the `/de/` `404`.

## Current State

1. `https://www.book.immo/api/page?lang=de` returns `200`.
2. `https://www.book.immo/api/directus?...` returns data, but the collections are empty:
   - `agents` => `{"data":[]}`
   - `properties` => `{"data":[]}`
   - `blog_posts` => `{"data":[]}`
3. The remaining problem is the deployed route handling on Vercel for the locale URLs.

## Relevant Files

- [`bookimmo/api/page.js`](/Users/miguelaprossine/bookimmo/api/page.js)
- [`bookimmo/api/directus.js`](/Users/miguelaprossine/bookimmo/api/directus.js)
- [`bookimmo/public/directus-bridge.js`](/Users/miguelaprossine/bookimmo/public/directus-bridge.js)
- [`bookimmo/vercel.json`](/Users/miguelaprossine/bookimmo/vercel.json)
