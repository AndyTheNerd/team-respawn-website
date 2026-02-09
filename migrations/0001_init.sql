CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  gamertag TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  match_type INTEGER,
  game_mode INTEGER,
  season_id TEXT,
  playlist_id TEXT,
  map_id TEXT,
  started_at TEXT,
  duration_seconds INTEGER,
  team_size INTEGER,
  ingested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL,
  player_key TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT,
  is_human INTEGER,
  team_id INTEGER,
  leader_id INTEGER,
  outcome INTEGER,
  units_destroyed INTEGER,
  units_lost INTEGER,
  leader_powers_used INTEGER,
  player_index INTEGER,
  PRIMARY KEY (match_id, player_key)
);

CREATE TABLE IF NOT EXISTS match_teams (
  match_id TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  outcome INTEGER,
  units_destroyed INTEGER,
  units_lost INTEGER,
  leader_powers_used INTEGER,
  PRIMARY KEY (match_id, team_id)
);

CREATE TABLE IF NOT EXISTS player_leader_powers (
  match_id TEXT NOT NULL,
  player_key TEXT NOT NULL,
  power_id TEXT NOT NULL,
  times_cast INTEGER NOT NULL,
  PRIMARY KEY (match_id, player_key, power_id)
);

CREATE TABLE IF NOT EXISTS search_events (
  search_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  searched_at TEXT NOT NULL,
  match_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_match_payloads (
  match_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_started_at ON matches(started_at);
CREATE INDEX IF NOT EXISTS idx_matches_map_id ON matches(map_id);
CREATE INDEX IF NOT EXISTS idx_matches_playlist_id ON matches(playlist_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_player_leader_powers_power_id ON player_leader_powers(power_id);
