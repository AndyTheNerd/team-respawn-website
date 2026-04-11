ALTER TABLE match_players ADD COLUMN raw_leader_id INTEGER;
ALTER TABLE match_players ADD COLUMN resolved_leader_id INTEGER;
ALTER TABLE match_players ADD COLUMN leader_resolution_source TEXT;
ALTER TABLE match_players ADD COLUMN leader_resolution_confidence TEXT;
ALTER TABLE match_players ADD COLUMN leader_resolution_reason TEXT;

UPDATE match_players
SET raw_leader_id = COALESCE(raw_leader_id, leader_id),
    resolved_leader_id = COALESCE(resolved_leader_id, leader_id),
    leader_resolution_source = COALESCE(
      leader_resolution_source,
      CASE WHEN leader_id IS NOT NULL THEN 'raw' ELSE 'unknown' END
    ),
    leader_resolution_confidence = COALESCE(
      leader_resolution_confidence,
      CASE WHEN leader_id IS NOT NULL THEN 'low' ELSE 'none' END
    ),
    leader_resolution_reason = COALESCE(
      leader_resolution_reason,
      CASE WHEN leader_id IS NOT NULL THEN 'legacy-backfill' ELSE 'no-leader-data' END
    );

CREATE INDEX IF NOT EXISTS idx_match_players_raw_leader_id ON match_players(raw_leader_id);
CREATE INDEX IF NOT EXISTS idx_match_players_resolved_leader_id ON match_players(resolved_leader_id);
