create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  name text,
  email_verified boolean not null default false,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  token_hash text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_id_idx
  on public.auth_sessions (user_id, expires_at desc);

create table if not exists public.email_verification_tokens (
  token_hash text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  token_hash text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  user_id text not null unique references public.app_users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  preferred_language text,
  current_city text,
  current_address text,
  move_in_date text,
  max_budget numeric,
  about_me text,
  occupation text,
  employment_status text,
  monthly_net_income text,
  adults_count integer,
  children_count integer,
  pets text,
  shared_apartment text,
  nationality text,
  profile_image text,
  preferred_districts text,
  cover_letter_template text,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  property_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index if not exists favorites_user_id_idx
  on public.favorites (user_id, created_at desc);

create table if not exists public.saved_searches (
  id text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx
  on public.saved_searches (user_id, updated_at desc);

create table if not exists public.applications (
  id text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  property_id text not null,
  status text not null default 'draft',
  cover_message text,
  source_channel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index if not exists applications_user_id_idx
  on public.applications (user_id, updated_at desc);

create table if not exists public.listings_cache (
  id bigserial primary key,
  source text not null,
  external_id text not null,
  slug text not null,
  title text not null,
  address text,
  postcode text,
  district text,
  price numeric,
  price_label text,
  area_sqm numeric,
  area_label text,
  rooms numeric,
  rooms_label text,
  image_url text,
  source_url text,
  lat double precision,
  lon double precision,
  listing_type text,
  published_label text,
  raw_payload jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists listings_cache_imported_at_idx
  on public.listings_cache (imported_at desc);

create index if not exists listings_cache_location_idx
  on public.listings_cache (district, postcode, imported_at desc);

create table if not exists public.contacts (
  id bigserial primary key,
  expose_id text not null unique,
  "timestamp" timestamptz,
  first_name text,
  last_name text,
  email text,
  phone text,
  url text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_status_timestamp_idx
  on public.contacts (status, "timestamp" desc);

create table if not exists public.apartments (
  id text primary key,
  title text not null,
  address text,
  price text,
  rooms numeric,
  district text,
  marketing_type text,
  url text,
  lat double precision,
  lon double precision,
  postcode text,
  found_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apartments_found_timestamp_idx
  on public.apartments (found_timestamp desc);

create table if not exists public.apartment_timeline (
  id bigserial primary key,
  expose_id text not null,
  event_type text not null,
  "timestamp" timestamptz not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists apartment_timeline_expose_idx
  on public.apartment_timeline (expose_id, "timestamp" asc);

create table if not exists public.apartment_replies (
  id bigserial primary key,
  expose_id text not null,
  sender_name text,
  reply_text text,
  reply_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists apartment_replies_expose_idx
  on public.apartment_replies (expose_id, reply_timestamp desc);

create table if not exists public.user_messages (
  id bigserial primary key,
  first_name text not null,
  last_name text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (first_name, last_name)
);
