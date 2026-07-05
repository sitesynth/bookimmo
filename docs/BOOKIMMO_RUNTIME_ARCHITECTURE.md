# Bookimmo Runtime Architecture

## Current split

### Frontend and client cabinet
- Uses **Supabase Auth** for signup, login, password reset, session state.
- Uses Supabase user tables for:
- `profiles`
- `favorites`
- `applications`
- Uses **Directus** for CMS-driven content and some property/media reads.

### Backend automation runtime
- Runs on Oracle as long-lived services:
- `bookimmo-xvfb.service`
- `bookimmo-chrome.service`
- `bookimmo-backend.service`
- Uses **local PostgreSQL on Oracle** for operational state:
- `contacts`
- `apartments`
- `apartment_timeline`
- `apartment_replies`
- `user_messages`

## Why this split exists

- Client auth and cabinet state are naturally user-facing and already integrated with Supabase.
- The apartment automation bot is operational infrastructure and should not depend on external Supabase pooler/DNS/runtime stability.
- Local PostgreSQL keeps monitor state, sent-contact history and agent workflow close to the browser automation runtime.

## Environment model

### Frontend
- `.env.local`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DIRECTUS_URL` if overridden

### Backend
- `backend/.env`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SERVER_URL`
- Telegram and Gmail credentials

## Deployment notes

- Initialize backend PostgreSQL with [init_oracle_postgres.sh](/Users/miguelaprossine/bookimmo/backend/init_oracle_postgres.sh).
- Schema lives in [bookimmo_backend_schema.sql](/Users/miguelaprossine/bookimmo/backend/bookimmo_backend_schema.sql).
- Browser automation depends on `Profile 5` and the unpacked extension in `backend/immoscout_contact_ext`.

## Practical rule

- If the feature is about **user identity, profile editing, bookmarks, application drafts in the cabinet**, keep it on Supabase unless we intentionally replace auth.
- If the feature is about **agent automation, contact sending, apartment monitoring, timelines, Gmail/Telegram ops**, keep it on Oracle PostgreSQL.
