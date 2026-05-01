/*
  Add media gallery support to campaigns.
  Run this in the Supabase SQL Editor (one-time migration).
*/

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]';
