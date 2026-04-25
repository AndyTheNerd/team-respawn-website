-- Optional public rules text and scheduled start time (Unix ms, local wall time intent).
ALTER TABLE tournaments ADD COLUMN rules TEXT;
ALTER TABLE tournaments ADD COLUMN starts_at INTEGER;
