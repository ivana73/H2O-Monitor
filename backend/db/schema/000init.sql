-- cache of source HTTP metadata + content hash
CREATE TABLE IF NOT EXISTS source_cache (
  url TEXT PRIMARY KEY,
  etag TEXT,
  last_modified TEXT,
  content_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- incidents scraped (no PostGIS yet; add later)
CREATE TABLE IF NOT EXISTS incident (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,            -- 'BVK' | 'Beograd'
  source_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  address_text TEXT,
  status TEXT DEFAULT 'active',    -- 'active' | 'resolved' | 'planned'
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  dedupe_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  lan DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  seen boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "user" (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    city TEXT NOT NULL,
    areas TEXT[],
    addressOfUser TEXT[]
);

CREATE TABLE IF NOT EXISTS reportedIncident (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    reportedDescription TEXT NOT NULL,
    reportedAddress TEXT NOT NULL
);
