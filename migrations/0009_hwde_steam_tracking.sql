CREATE TABLE IF NOT EXISTS hwde_steam_player_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sampled_at TEXT NOT NULL,
  sample_day TEXT NOT NULL,
  current_players INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hwde_steam_player_samples_day
  ON hwde_steam_player_samples(sample_day, sampled_at);

CREATE TABLE IF NOT EXISTS hwde_steam_daily_summary (
  sample_day TEXT PRIMARY KEY,
  peak_players INTEGER NOT NULL,
  peak_sampled_at TEXT NOT NULL,
  last_sampled_at TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0
);
