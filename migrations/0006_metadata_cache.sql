-- Metadata cache for leader powers, game objects, and techs
-- These are fetched from the Halo API with pagination and aggregated
-- into key-value maps stored as JSON blobs.
CREATE TABLE IF NOT EXISTS metadata_cache (
  cache_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
