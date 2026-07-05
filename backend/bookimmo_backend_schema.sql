CREATE TABLE IF NOT EXISTS public.contacts (
    id BIGSERIAL PRIMARY KEY,
    expose_id TEXT NOT NULL UNIQUE,
    "timestamp" TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contacts_status_timestamp_idx
    ON public.contacts (status, "timestamp" DESC);

CREATE TABLE IF NOT EXISTS public.apartments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    address TEXT,
    price TEXT,
    rooms NUMERIC,
    district TEXT,
    marketing_type TEXT,
    url TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    postcode TEXT,
    found_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apartments_found_timestamp_idx
    ON public.apartments (found_timestamp DESC);

CREATE TABLE IF NOT EXISTS public.apartment_timeline (
    id BIGSERIAL PRIMARY KEY,
    expose_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apartment_timeline_expose_idx
    ON public.apartment_timeline (expose_id, "timestamp" ASC);

CREATE TABLE IF NOT EXISTS public.apartment_replies (
    id BIGSERIAL PRIMARY KEY,
    expose_id TEXT NOT NULL,
    sender_name TEXT,
    reply_text TEXT,
    reply_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apartment_replies_expose_idx
    ON public.apartment_replies (expose_id, reply_timestamp DESC);

CREATE TABLE IF NOT EXISTS public.user_messages (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (first_name, last_name)
);
