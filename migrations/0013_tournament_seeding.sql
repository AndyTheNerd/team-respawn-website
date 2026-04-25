-- Add seeding strategy to tournaments (reserved for future custom seeding UI).
-- Default 'join_order' preserves existing behaviour (seed in join order ASC).
ALTER TABLE tournaments ADD COLUMN seeding TEXT NOT NULL DEFAULT 'join_order';
