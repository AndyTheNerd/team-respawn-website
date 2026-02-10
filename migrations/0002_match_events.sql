CREATE TABLE IF NOT EXISTS raw_event_payloads (
  match_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  is_complete INTEGER,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_event_summaries (
  match_id TEXT NOT NULL,
  player_index INTEGER NOT NULL,
  team_id INTEGER,
  units_trained INTEGER NOT NULL,
  buildings_completed INTEGER NOT NULL,
  building_upgrades INTEGER NOT NULL,
  unit_upgrades INTEGER NOT NULL,
  leader_powers_cast INTEGER NOT NULL,
  veterancy_promotions INTEGER NOT NULL,
  build_order_json TEXT,
  first_event_ms INTEGER,
  last_event_ms INTEGER,
  ingested_at TEXT NOT NULL,
  PRIMARY KEY (match_id, player_index)
);

CREATE INDEX IF NOT EXISTS idx_match_event_summaries_match_id ON match_event_summaries(match_id);
CREATE INDEX IF NOT EXISTS idx_match_event_summaries_team_id ON match_event_summaries(team_id);
