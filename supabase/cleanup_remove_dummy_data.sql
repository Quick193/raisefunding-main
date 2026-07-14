-- =============================================================
-- cleanup_remove_dummy_data.sql
-- Removes ALL seeded/dummy campaigns before going live.
--
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- What it does:
--   * Deletes every campaign and cascades to its related rows
--     (donations, reports, feature_payments, withdrawals).
--   * KEEPS your user accounts/profiles (profiles are a parent of
--     campaigns, so they are NOT touched).
--
-- SAFE ONLY when every campaign is dummy/test data. If you have any
-- REAL campaign you want to keep, DO NOT run this — ask for the
-- surgical (title-matched) version instead.
-- =============================================================

BEGIN;

-- How many campaigns exist right now (for your records)
SELECT count(*) AS campaigns_before FROM public.campaigns;

-- Wipe all campaigns + cascade to donations / reports / payments / withdrawals
TRUNCATE public.campaigns CASCADE;

-- Confirm the clean slate (should return 0)
SELECT count(*) AS campaigns_after FROM public.campaigns;

COMMIT;

-- Optional: prevent accidental re-seeding in this session
-- (the seed scripts refuse to run unless this flag is 'true')
RESET app.allow_test_seed;
