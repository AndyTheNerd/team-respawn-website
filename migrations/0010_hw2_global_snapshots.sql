CREATE TABLE IF NOT EXISTS hw2_snapshot_runs (
  snapshot_id TEXT PRIMARY KEY,
  dataset_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_label TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notes_json TEXT
);

CREATE TABLE IF NOT EXISTS hw2_playlist_snapshot_summary (
  snapshot_id TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  playlist_name TEXT,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_players INTEGER NOT NULL DEFAULT 0,
  avg_duration_seconds REAL,
  median_units_destroyed REAL,
  median_units_lost REAL,
  median_powers_per_player REAL,
  quit_rate REAL,
  sample_high_rank_players INTEGER,
  sample_mid_rank_players INTEGER,
  sample_match_count INTEGER,
  trend_days INTEGER,
  PRIMARY KEY (snapshot_id, playlist_id)
);

CREATE TABLE IF NOT EXISTS hw2_playlist_snapshot_maps (
  snapshot_id TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  match_count INTEGER NOT NULL DEFAULT 0,
  median_seconds REAL,
  PRIMARY KEY (snapshot_id, playlist_id, map_id)
);

CREATE TABLE IF NOT EXISTS hw2_playlist_snapshot_leaders (
  snapshot_id TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  leader_id INTEGER NOT NULL,
  match_count INTEGER NOT NULL DEFAULT 0,
  win_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (snapshot_id, playlist_id, leader_id)
);

CREATE TABLE IF NOT EXISTS hw2_playlist_snapshot_leaderboards (
  snapshot_id TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  rank_position INTEGER NOT NULL,
  player_id TEXT,
  gamertag TEXT NOT NULL,
  rating REAL,
  tier TEXT,
  movement INTEGER,
  PRIMARY KEY (snapshot_id, playlist_id, rank_position)
);

CREATE INDEX IF NOT EXISTS idx_hw2_snapshot_runs_dataset_generated
  ON hw2_snapshot_runs(dataset_key, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_hw2_playlist_snapshot_summary_playlist
  ON hw2_playlist_snapshot_summary(playlist_id, snapshot_id);

CREATE INDEX IF NOT EXISTS idx_hw2_playlist_snapshot_maps_playlist
  ON hw2_playlist_snapshot_maps(playlist_id, snapshot_id);

CREATE INDEX IF NOT EXISTS idx_hw2_playlist_snapshot_leaders_playlist
  ON hw2_playlist_snapshot_leaders(playlist_id, snapshot_id);

CREATE INDEX IF NOT EXISTS idx_hw2_playlist_snapshot_leaderboards_playlist
  ON hw2_playlist_snapshot_leaderboards(playlist_id, snapshot_id, rank_position);
