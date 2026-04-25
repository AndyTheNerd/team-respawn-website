-- Remove duplicate tournament participants that differ only by capitalization,
-- keeping the earliest inserted row in each tournament.
DELETE FROM tournament_participants
WHERE id IN (
  SELECT tp.id
  FROM tournament_participants tp
  JOIN (
    SELECT tournament_id, LOWER(gamertag) AS normalized_gamertag, MIN(id) AS keep_id
    FROM tournament_participants
    GROUP BY tournament_id, LOWER(gamertag)
    HAVING COUNT(*) > 1
  ) dup
    ON dup.tournament_id = tp.tournament_id
   AND dup.normalized_gamertag = LOWER(tp.gamertag)
  WHERE tp.id <> dup.keep_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_participants_tid_gamertag_nocase
  ON tournament_participants(tournament_id, LOWER(gamertag));
