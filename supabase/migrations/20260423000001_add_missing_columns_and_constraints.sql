/*
  # Add missing columns, DB-level constraints, and performance indexes

  1. Missing columns
     - profiles.phone_number
     - campaigns.category
     - campaigns.location

  2. DB-level constraints to back up frontend validation
     - campaigns: title length, description length, goal_amount floor & ceiling
     - donations: amount minimum ₹1, donor_email format

  3. Performance indexes
     - campaigns(category) — for related-campaigns query in CampaignDetail
     - campaigns(status, created_at) — for Dashboard and Campaigns page filter+sort
*/

-- ── profiles ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

-- ── campaigns ────────────────────────────────────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS location  text;

-- Title: 10–100 characters
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_title_length
    CHECK (char_length(trim(title)) BETWEEN 10 AND 100);

-- Description: 50–5000 characters
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_description_length
    CHECK (char_length(trim(description)) BETWEEN 50 AND 5000);

-- Goal: ₹100 minimum, ₹10 crore maximum
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_goal_amount_check,
  ADD CONSTRAINT campaigns_goal_amount_check
    CHECK (goal_amount BETWEEN 100 AND 100000000);

-- ── donations ─────────────────────────────────────────────────────────────────
-- Minimum donation ₹1
ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_amount_check,
  ADD CONSTRAINT donations_amount_check
    CHECK (amount >= 1);

-- Basic email format guard (prevents obviously malformed emails)
ALTER TABLE donations
  ADD CONSTRAINT donations_email_format
    CHECK (donor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaigns_category
  ON campaigns(category);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_created
  ON campaigns(status, created_at DESC);
