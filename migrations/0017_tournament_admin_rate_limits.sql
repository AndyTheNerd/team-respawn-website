-- Per (tournament, client bucket) tracking of failed admin password attempts; 5 failures -> 24h lockout.
-- client_key holds SHA-256(pepper|tournament_id|ip) only (see TOURNAMENT_RATE_LIMIT_PEPPER); never raw IPs.
CREATE TABLE IF NOT EXISTS tournament_admin_rate_limits (
  tournament_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tournament_id, client_key)
);
