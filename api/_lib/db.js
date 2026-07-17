import crypto from 'node:crypto'
import { Pool } from 'pg'
import { loadLocalEnv } from './env.js'

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
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema()
  }
  return schemaPromise
}
