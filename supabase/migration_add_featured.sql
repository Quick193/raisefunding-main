/*
  Add featured campaign support.
  Run in Supabase SQL Editor (one-time migration).
*/

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS is_featured   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_campaigns_featured
  ON campaigns (is_featured, featured_until DESC)
  WHERE is_featured = true;
