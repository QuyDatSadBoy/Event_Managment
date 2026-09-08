-- ============================================================
-- Event Management Platform — schema
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Admin users ----------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL DEFAULT '',
    role          TEXT NOT NULL DEFAULT 'editor',   -- admin | editor
    avatar        TEXT NOT NULL DEFAULT '',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Site-wide settings (single row, id = 1) ----------
CREATE TABLE IF NOT EXISTS settings (
    id                 INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    event_name         TEXT NOT NULL DEFAULT 'Event',
    event_tagline      TEXT NOT NULL DEFAULT '',
    event_description  TEXT NOT NULL DEFAULT '',
    hero_title         TEXT NOT NULL DEFAULT '',
    hero_subtitle      TEXT NOT NULL DEFAULT '',
    hero_image         TEXT NOT NULL DEFAULT '',
    logo               TEXT NOT NULL DEFAULT '',
    start_date         TIMESTAMPTZ,
    end_date           TIMESTAMPTZ,
    venue_name         TEXT NOT NULL DEFAULT '',
    venue_address      TEXT NOT NULL DEFAULT '',
    venue_map_url      TEXT NOT NULL DEFAULT '',
    contact_email      TEXT NOT NULL DEFAULT '',
    contact_phone      TEXT NOT NULL DEFAULT '',
    contact_address    TEXT NOT NULL DEFAULT '',
    about_title        TEXT NOT NULL DEFAULT '',
    about_content      TEXT NOT NULL DEFAULT '',
    about_image        TEXT NOT NULL DEFAULT '',
    socials            JSONB NOT NULL DEFAULT '{}'::jsonb,
    stats              JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights         JSONB NOT NULL DEFAULT '[]'::jsonb,
    hero_slides        JSONB NOT NULL DEFAULT '[]'::jsonb,
    seo_title          TEXT NOT NULL DEFAULT '',
    seo_description    TEXT NOT NULL DEFAULT '',
    registration_open  BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Speakers ----------
CREATE TABLE IF NOT EXISTS speakers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    company     TEXT NOT NULL DEFAULT '',
    country     TEXT NOT NULL DEFAULT '',
    photo       TEXT NOT NULL DEFAULT '',
    bio         TEXT NOT NULL DEFAULT '',
    short_bio   TEXT NOT NULL DEFAULT '',
    topics      TEXT[] NOT NULL DEFAULT '{}',
    socials     JSONB NOT NULL DEFAULT '{}'::jsonb,
    featured    BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_speakers_pub  ON speakers (is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_speakers_feat ON speakers (featured) WHERE featured;

-- ---------- Agenda ----------
CREATE TABLE IF NOT EXISTS agenda_days (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label      TEXT NOT NULL,                 -- "Day 1"
    title      TEXT NOT NULL DEFAULT '',      -- "Khai mạc & Toàn thể"
    date       DATE NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id      UUID NOT NULL REFERENCES agenda_days(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    start_time  TEXT NOT NULL DEFAULT '',     -- "09:00"
    end_time    TEXT NOT NULL DEFAULT '',     -- "10:30"
    room        TEXT NOT NULL DEFAULT '',
    track       TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT 'session', -- session|keynote|panel|break|networking|workshop
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_day ON agenda_sessions (day_id, sort_order);

CREATE TABLE IF NOT EXISTS session_speakers (
    session_id UUID NOT NULL REFERENCES agenda_sessions(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, speaker_id)
);

-- ---------- News / Posts (news + speech share one template) ----------
CREATE TABLE IF NOT EXISTS posts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    excerpt      TEXT NOT NULL DEFAULT '',
    content      TEXT NOT NULL DEFAULT '',
    cover        TEXT NOT NULL DEFAULT '',
    category     TEXT NOT NULL DEFAULT 'news',  -- news | speech | press | announcement
    tags         TEXT[] NOT NULL DEFAULT '{}',
    author_name  TEXT NOT NULL DEFAULT '',
    speaker_id   UUID REFERENCES speakers(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    featured     BOOLEAN NOT NULL DEFAULT FALSE,
    views        INT NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_list ON posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_cat  ON posts (category, is_published, published_at DESC);

-- ---------- Gallery / Media library ----------
CREATE TABLE IF NOT EXISTS gallery_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT 'image',  -- image | video | document
    url         TEXT NOT NULL DEFAULT '',
    thumbnail   TEXT NOT NULL DEFAULT '',
    album       TEXT NOT NULL DEFAULT '',
    file_size   BIGINT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gallery ON gallery_items (type, is_published, sort_order);

-- ---------- Partners / Sponsors ----------
CREATE TABLE IF NOT EXISTS partners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    logo        TEXT NOT NULL DEFAULT '',
    website     TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tier        TEXT NOT NULL DEFAULT 'partner', -- diamond|platinum|gold|silver|bronze|partner|media
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partners ON partners (is_published, tier, sort_order);

-- ---------- Registrations ----------
CREATE TABLE IF NOT EXISTS registrations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT NOT NULL UNIQUE,
    full_name    TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT NOT NULL DEFAULT '',
    company      TEXT NOT NULL DEFAULT '',
    job_title    TEXT NOT NULL DEFAULT '',
    country      TEXT NOT NULL DEFAULT 'Vietnam',
    ticket_type  TEXT NOT NULL DEFAULT 'visitor', -- visitor|delegate|exhibitor|press|vip
    interests    TEXT[] NOT NULL DEFAULT '{}',
    note         TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|cancelled|checked_in
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_created ON registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_email   ON registrations (email);

-- ---------- Contact messages ----------
CREATE TABLE IF NOT EXISTS contacts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL DEFAULT '',
    subject    TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts ON contacts (is_read, created_at DESC);

-- ---------- Uploaded media ----------
CREATE TABLE IF NOT EXISTS media (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename     TEXT NOT NULL,
    original_name TEXT NOT NULL DEFAULT '',
    url          TEXT NOT NULL,
    mime_type    TEXT NOT NULL DEFAULT '',
    size         BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
