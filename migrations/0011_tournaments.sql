-- Tournament records
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  admin_token_hash TEXT NOT NULL,
  join_password_hash TEXT,                          -- NULL = open sign-ups, set = private join
  format TEXT NOT NULL DEFAULT 'single_elimination', -- 'single_elimination' | 'double_elimination'
  status TEXT NOT NULL DEFAULT 'registration',       -- 'registration' | 'active' | 'completed'
  bracket_data TEXT,                                 -- full brackets-manager JSON state
  max_participants INTEGER NOT NULL DEFAULT 16,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL                        -- created_at + 30 days (Unix ms)
);

-- Participants who have joined a tournament
CREATE TABLE IF NOT EXISTS tournament_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  gamertag TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  UNIQUE(tournament_id, gamertag)
);

-- Per-match metadata: map/leader picks, HW2 link, override flag
CREATE TABLE IF NOT EXISTS tournament_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  brackets_match_id INTEGER NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  map_id TEXT,
  p1_leader_id INTEGER,
  p2_leader_id INTEGER,
  hw2_match_id TEXT,
  override_by_organizer INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',            -- 'pending' | 'completed'
  UNIQUE(tournament_id, brackets_match_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tid ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tid ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_expires ON tournaments(expires_at);
