/*
  Add featured_since for fair carousel rotation.
  Run in Supabase SQL Editor (one-time migration).

  Logic:
  - featured_since is stamped when a campaign is marked featured
  - Campaigns featured < 24 h ago are "protected" (guaranteed first day)
  - Campaigns featured ≥ 24 h ago are "eligible" to be displaced when >30 are featured
  - Max 30 slots: protected first, then eligible fills remaining slots
*/

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS featured_since timestamptz;

-- Backfill: treat all currently-featured campaigns as already having served
-- their first day so they don't block incoming new campaigns
UPDATE campaigns
SET featured_since = NOW() - INTERVAL '25 hours'
WHERE is_featured = true
  AND featured_since IS NULL;

-- Rebuild index to include featured_since for efficient ordering
DROP INDEX IF EXISTS idx_campaigns_featured;
CREATE INDEX IF NOT EXISTS idx_campaigns_featured
  ON campaigns (is_featured, featured_until DESC, featured_since DESC)
  WHERE is_featured = true;
