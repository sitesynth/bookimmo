import crypto from 'node:crypto'
import { Pool } from 'pg'
import { loadLocalEnv } from './env.js'
import { CITY_SEED, COUNTRY_SEED } from './reference-data.js'

loadLocalEnv()

let pool
let schemaPromise

function resolveSslConfig() {
  const sslMode = String(
    process.env.DB_SSLMODE
    || process.env.PGSSLMODE
    || '',
  ).toLowerCase()

  if (sslMode === 'disable') return false
  if (sslMode === 'verify-full') return { rejectUnauthorized: true }
  if (sslMode === 'require' || sslMode === 'prefer' || sslMode === 'allow') {
    return { rejectUnauthorized: false }
  }

  // Default to tolerant SSL for hosted/self-signed Postgres unless explicitly disabled.
  return { rejectUnauthorized: false }
}

function readConfig() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
  const ssl = resolveSslConfig()

  if (connectionString) {
    return {
      connectionString,
      ssl,
    }
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'bookimmo_backend',
    user: process.env.DB_USER || 'bookimmo_backend',
    password: process.env.DB_PASSWORD || '',
    ssl,
  }
}

export function getPool() {
  if (!pool) {
    pool = new Pool(readConfig())
  }
  return pool
}

export async function query(text, params = []) {
  await ensureSchema()
  return getPool().query(text, params)
}

export async function withClient(fn) {
  await ensureSchema()
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export function newId() {
  return crypto.randomUUID()
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

async function createSchema() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'client',
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.app_users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

    CREATE TABLE IF NOT EXISTS public.auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
      ON public.auth_sessions (user_id, expires_at DESC);

    CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      preferred_language TEXT,
      current_city TEXT,
      current_address TEXT,
      move_in_date TEXT,
      max_budget NUMERIC,
      about_me TEXT,
      occupation TEXT,
      employment_status TEXT,
      monthly_net_income TEXT,
      adults_count INTEGER,
      children_count INTEGER,
      pets TEXT,
      shared_apartment TEXT,
      nationality TEXT,
      profile_image TEXT,
      preferred_districts TEXT,
      cover_letter_template TEXT,
      documents JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.agent_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
      display_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      account_type TEXT NOT NULL DEFAULT 'independent',
      organization_id TEXT,
      country_code TEXT,
      base_city_id TEXT,
      base_city TEXT,
      service_regions JSONB NOT NULL DEFAULT '[]'::jsonb,
      bio TEXT,
      capacity_limit INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.agent_profiles
      ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'independent',
      ADD COLUMN IF NOT EXISTS organization_id TEXT,
      ADD COLUMN IF NOT EXISTS country_code TEXT,
      ADD COLUMN IF NOT EXISTS base_city_id TEXT;

    CREATE INDEX IF NOT EXISTS agent_profiles_active_idx
      ON public.agent_profiles (is_active, base_city);

    CREATE TABLE IF NOT EXISTS public.countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.cities (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
      name TEXT NOT NULL,
      region TEXT,
      slug TEXT NOT NULL,
      population INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (country_code, slug)
    );

    CREATE INDEX IF NOT EXISTS cities_lookup_idx
      ON public.cities (country_code, is_active, population DESC, name ASC);

    CREATE TABLE IF NOT EXISTS public.organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country_code TEXT REFERENCES public.countries(code) ON DELETE SET NULL,
      website TEXT,
      kind TEXT NOT NULL DEFAULT 'agency',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'agent',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (organization_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.agent_city_coverage (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
      city_slug TEXT NOT NULL,
      district_slug TEXT,
      priority INTEGER NOT NULL DEFAULT 100,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (agent_id, city_slug, district_slug)
    );

    CREATE INDEX IF NOT EXISTS agent_city_coverage_lookup_idx
      ON public.agent_city_coverage (city_slug, district_slug, active, priority);

    CREATE TABLE IF NOT EXISTS public.agent_provider_accounts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
      provider_source TEXT NOT NULL,
      account_label TEXT NOT NULL,
      external_account_ref TEXT,
      browser_profile_key TEXT,
      session_state TEXT NOT NULL DEFAULT 'cold',
      last_sync_at TIMESTAMPTZ,
      health_status TEXT NOT NULL DEFAULT 'unknown',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider_source, account_label)
    );

    CREATE INDEX IF NOT EXISTS agent_provider_accounts_agent_idx
      ON public.agent_provider_accounts (agent_id, provider_source, is_active);

    CREATE TABLE IF NOT EXISTS public.favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, property_id)
    );

    CREATE INDEX IF NOT EXISTS favorites_user_id_idx
      ON public.favorites (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      filters JSONB NOT NULL DEFAULT '{}'::jsonb,
      notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx
      ON public.saved_searches (user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS public.applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      cover_message TEXT,
      source_channel TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, property_id)
    );

    CREATE INDEX IF NOT EXISTS applications_user_id_idx
      ON public.applications (user_id, updated_at DESC);

    ALTER TABLE public.applications
      ADD COLUMN IF NOT EXISTS provider_source TEXT,
      ADD COLUMN IF NOT EXISTS provider_expose_id TEXT,
      ADD COLUMN IF NOT EXISTS provider_conversation_id TEXT,
      ADD COLUMN IF NOT EXISTS assigned_agent_id TEXT,
      ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
      ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS conversation_state TEXT NOT NULL DEFAULT 'none';

    CREATE INDEX IF NOT EXISTS applications_provider_lookup_idx
      ON public.applications (provider_source, provider_expose_id, provider_conversation_id);

    CREATE TABLE IF NOT EXISTS public.application_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_source TEXT NOT NULL,
      actor_role TEXT,
      title TEXT,
      body TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      occurred_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS application_events_application_id_idx
      ON public.application_events (application_id, occurred_at DESC);

    CREATE TABLE IF NOT EXISTS public.application_messages (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
      provider_source TEXT NOT NULL,
      external_thread_id TEXT,
      external_message_id TEXT,
      direction TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
      message_timestamp TIMESTAMPTZ NOT NULL,
      is_unread_for_client BOOLEAN NOT NULL DEFAULT TRUE,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS application_messages_application_id_idx
      ON public.application_messages (application_id, message_timestamp DESC);

    CREATE INDEX IF NOT EXISTS application_messages_thread_idx
      ON public.application_messages (provider_source, external_thread_id, external_message_id);

    CREATE TABLE IF NOT EXISTS public.application_provider_threads (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
      provider_source TEXT NOT NULL,
      provider_conversation_id TEXT,
      provider_expose_id TEXT,
      provider_listing_address TEXT,
      counterparty_name TEXT,
      counterparty_role TEXT,
      account_label TEXT,
      last_message_at TIMESTAMPTZ,
      last_message_preview TEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_synced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS application_provider_threads_application_idx
      ON public.application_provider_threads (application_id, provider_source);

    CREATE UNIQUE INDEX IF NOT EXISTS application_provider_threads_conversation_idx
      ON public.application_provider_threads (provider_source, provider_conversation_id)
      WHERE provider_conversation_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS application_provider_threads_expose_idx
      ON public.application_provider_threads (provider_source, provider_expose_id);

    CREATE TABLE IF NOT EXISTS public.listings_cache (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      address TEXT,
      postcode TEXT,
      district TEXT,
      price NUMERIC,
      price_label TEXT,
      area_sqm NUMERIC,
      area_label TEXT,
      rooms NUMERIC,
      rooms_label TEXT,
      image_url TEXT,
      source_url TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      listing_type TEXT,
      published_label TEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source, external_id)
    );

    CREATE INDEX IF NOT EXISTS listings_cache_imported_at_idx
      ON public.listings_cache (imported_at DESC);

    CREATE INDEX IF NOT EXISTS listings_cache_location_idx
      ON public.listings_cache (district, postcode, imported_at DESC);
  `

  await getPool().query(sql)
}

async function addConstraintIfMissing(name, statement) {
  const existing = await getPool().query(
    `SELECT 1
     FROM pg_constraint
     WHERE conname = $1
     LIMIT 1`,
    [name],
  )

  if (!existing.rows[0]) {
    await getPool().query(statement)
  }
}

async function ensureReferenceData() {
  await addConstraintIfMissing(
    'agent_profiles_organization_id_fkey',
    `ALTER TABLE public.agent_profiles
       ADD CONSTRAINT agent_profiles_organization_id_fkey
       FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL`,
  )
  await addConstraintIfMissing(
    'agent_profiles_country_code_fkey',
    `ALTER TABLE public.agent_profiles
       ADD CONSTRAINT agent_profiles_country_code_fkey
       FOREIGN KEY (country_code) REFERENCES public.countries(code) ON DELETE SET NULL`,
  )
  await addConstraintIfMissing(
    'agent_profiles_base_city_id_fkey',
    `ALTER TABLE public.agent_profiles
       ADD CONSTRAINT agent_profiles_base_city_id_fkey
       FOREIGN KEY (base_city_id) REFERENCES public.cities(id) ON DELETE SET NULL`,
  )

  for (const item of COUNTRY_SEED) {
    await getPool().query(
      `INSERT INTO public.countries (code, name, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             priority = EXCLUDED.priority,
             updated_at = NOW()`,
      [item.code, item.name, item.priority || 0],
    )
  }

  for (const item of CITY_SEED) {
    await getPool().query(
      `INSERT INTO public.cities (id, country_code, name, region, slug, population, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (id) DO UPDATE
         SET country_code = EXCLUDED.country_code,
             name = EXCLUDED.name,
             region = EXCLUDED.region,
             slug = EXCLUDED.slug,
             population = EXCLUDED.population,
             is_active = TRUE,
             updated_at = NOW()`,
      [
        item.id,
        item.countryCode,
        item.name,
        item.region || null,
        item.slug,
        Number.isFinite(item.population) ? item.population : null,
      ],
    )
  }
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await createSchema()
      await ensureReferenceData()
    })()
  }
  return schemaPromise
}
