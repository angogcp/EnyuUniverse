-- Project J / EnyuUniverse — PostgreSQL Schema
-- Local-first MVP uses localStorage; this schema is the future Supabase/PostgreSQL migration target.
-- Last updated: 2026-06-13

-- ══════════════════════════════════════════════
-- 1. Custom ENUM Types
-- ══════════════════════════════════════════════

CREATE TYPE user_role      AS ENUM ('Father', 'Child', 'Mother', 'Guest');
CREATE TYPE visibility_type AS ENUM ('public', 'private');
CREATE TYPE dream_status   AS ENUM ('active', 'achieved', 'paused');
CREATE TYPE travel_type    AS ENUM ('plan', 'story', 'blog', 'album');
CREATE TYPE artwork_type   AS ENUM (
  'hand-drawn', 'draft', 'comic', 'novel',
  'wargame', 'sci-fi', 'mystery', 'character', 'worldview'
);
CREATE TYPE timeline_type  AS ENUM ('creation', 'school', 'life', 'other');

-- ══════════════════════════════════════════════
-- 2. Core Tables
-- ══════════════════════════════════════════════

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    role        user_role NOT NULL DEFAULT 'Guest',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Artworks (Creation Hall — 创作馆)
CREATE TABLE IF NOT EXISTS artworks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    description      TEXT,
    type             artwork_type NOT NULL,
    tags             TEXT[]  DEFAULT '{}',
    visibility       visibility_type NOT NULL DEFAULT 'private',
    drive_file_id    TEXT,
    drive_preview_url TEXT,
    drive_folder     TEXT,
    gallery_images   TEXT[]  DEFAULT '{}',   -- Ordered list of image URLs for carousel
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Conversations (Co-creation chat — attached to artworks OR travel entries)
-- artwork_ref_id is a generic reference: can point to artworks.id or travel_entries.id
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id   TEXT NOT NULL,   -- stores artworks.id OR travel_entries.id (generic ref)
    sender_id    UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    content      TEXT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Characters (World Building — 角色人设)
CREATE TABLE IF NOT EXISTS characters (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 TEXT NOT NULL,
    description          TEXT,
    dream                TEXT,
    weakness             TEXT,
    personality          TEXT,
    image_url            TEXT,          -- Portrait illustration URL
    related_artwork_ids  UUID[] DEFAULT '{}',
    created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Worlds (World Building — 世界观)
CREATE TABLE IF NOT EXISTS worlds (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    rules       TEXT,
    history     TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Timeline Events (Growth Rings — 成长年轮)
CREATE TABLE IF NOT EXISTS timeline_events (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year               INTEGER NOT NULL,
    date               DATE NOT NULL,
    title              TEXT NOT NULL,
    description        TEXT,
    type               timeline_type NOT NULL DEFAULT 'life',
    related_artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
    created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Dreams (Dream Archive — 梦想档案)
CREATE TABLE IF NOT EXISTS dreams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    target_date DATE,
    status      dream_status NOT NULL DEFAULT 'active',
    reflection  TEXT,                   -- Post-achievement reflection text
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Travel Entries (Travel Hall — 足迹馆)
CREATE TABLE IF NOT EXISTS travel_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    destination TEXT NOT NULL,
    date        DATE NOT NULL,
    type        travel_type NOT NULL DEFAULT 'blog',
    content     TEXT,                   -- Markdown content
    image_url   TEXT,                   -- Cover image URL
    visibility  visibility_type NOT NULL DEFAULT 'private',
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTE: Achievements are COMPUTED, not stored.
-- They are derived from counts of artworks, characters, worlds, dreams,
-- travel_entries, and conversations at runtime. No table needed.

-- Drive Files Cache (future Google Drive integration)
CREATE TABLE IF NOT EXISTS drive_files (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_file_id  TEXT UNIQUE NOT NULL,
    file_name      TEXT NOT NULL,
    mime_type      TEXT,
    folder_path    TEXT,
    preview_url    TEXT,
    web_view_link  TEXT,
    visibility     visibility_type NOT NULL DEFAULT 'private',
    created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ══════════════════════════════════════════════
-- 3. Auto-update timestamps trigger
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artworks_modtime
  BEFORE UPDATE ON artworks FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_characters_modtime
  BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_worlds_modtime
  BEFORE UPDATE ON worlds FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_dreams_modtime
  BEFORE UPDATE ON dreams FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_travel_entries_modtime
  BEFORE UPDATE ON travel_entries FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ══════════════════════════════════════════════
-- 4. Row-Level Security (RLS) — for future Supabase deployment
-- ══════════════════════════════════════════════

-- Enable RLS on sensitive tables
ALTER TABLE artworks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_entries ENABLE ROW LEVEL SECURITY;

-- Public artworks are readable by anyone
CREATE POLICY "public_artworks_read" ON artworks
  FOR SELECT USING (visibility = 'public');

-- Family members (Child, Father, Mother) can read all artworks
CREATE POLICY "family_artworks_read" ON artworks
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('Child', 'Father', 'Mother')
  );

-- Only Child and Father can write artworks
CREATE POLICY "authors_artworks_write" ON artworks
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('Child', 'Father')
  );

-- Dreams are private to family only
CREATE POLICY "family_dreams_read" ON dreams
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('Child', 'Father', 'Mother')
  );

-- Only Child and Father can manage dreams
CREATE POLICY "authors_dreams_write" ON dreams
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('Child', 'Father')
  );

-- Public travel entries readable by all; private only by family
CREATE POLICY "public_travel_read" ON travel_entries
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "family_travel_read" ON travel_entries
  FOR SELECT USING (
    visibility = 'private' AND
    auth.jwt() ->> 'role' IN ('Child', 'Father', 'Mother')
  );
