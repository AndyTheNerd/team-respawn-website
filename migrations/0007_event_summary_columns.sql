-- Add new aggregate columns for enhanced event tracking (Didact integration Phase 2)
ALTER TABLE match_event_summaries ADD COLUMN units_lost INTEGER DEFAULT 0;
ALTER TABLE match_event_summaries ADD COLUMN buildings_recycled INTEGER DEFAULT 0;
