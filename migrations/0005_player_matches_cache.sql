CREATE TABLE IF NOT EXISTS player_matches_cache (
  player_id TEXT PRIMARY KEY,
  gamertag TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_matches_cache_fetched_at ON player_matches_cache(fetched_at);
