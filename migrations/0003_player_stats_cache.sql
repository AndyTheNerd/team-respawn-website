CREATE TABLE IF NOT EXISTS player_stats_cache (
  player_id TEXT PRIMARY KEY,
  gamertag TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_season_stats_cache (
  player_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  gamertag TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (player_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_cache_fetched_at ON player_stats_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_player_season_stats_cache_fetched_at ON player_season_stats_cache(fetched_at);
