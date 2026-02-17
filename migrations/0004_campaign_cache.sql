CREATE TABLE IF NOT EXISTS player_campaign_cache (
  player_id TEXT PRIMARY KEY,
  gamertag TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_levels_cache (
  cache_key TEXT PRIMARY KEY DEFAULT 'campaign_levels',
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_campaign_cache_fetched_at ON player_campaign_cache(fetched_at);
