CREATE TABLE IF NOT EXISTS match_summaries (
  match_id TEXT NOT NULL,
  gamertag TEXT NOT NULL,
  summary TEXT NOT NULL,
  model TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  PRIMARY KEY (match_id, gamertag)
);
