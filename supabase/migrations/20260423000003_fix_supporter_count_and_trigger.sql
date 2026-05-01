/*
  # Add supporter_count and fix update_campaign_amount trigger

  1. Problems fixed
     - update_campaign_amount() was NOT SECURITY DEFINER, so the trigger's
       UPDATE on campaigns failed silently for every donor who is not the
       campaign creator (including all anonymous donors). Campaign amounts were
       never updating in practice.
     - The donations SELECT policy now restricts non-creators from reading
       donation rows (migration 2), so a public COUNT(*) on donations no longer
       works. We add a denormalized supporter_count column to campaigns that the
       trigger keeps up to date, preserving public visibility without exposing PII.

  2. Changes
     - campaigns.supporter_count  integer column, default 0
     - Backfill supporter_count from existing donations
     - Recreate update_campaign_amount() as SECURITY DEFINER and increment
       supporter_count on each new donation
*/

-- ── campaigns ────────────────────────────────────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS supporter_count integer NOT NULL DEFAULT 0;

-- Backfill from existing donation rows (runs once at migration time)
UPDATE campaigns c
SET supporter_count = (
  SELECT COUNT(*) FROM donations d WHERE d.campaign_id = c.id
);

-- ── trigger ───────────────────────────────────────────────────────────────────

-- SECURITY DEFINER lets the function bypass RLS so it can UPDATE campaigns
-- regardless of who inserted the donation (anon or authenticated non-creator).
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET current_amount  = current_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      updated_at      = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger (function swap is enough; DROP+CREATE is safer across envs)
DROP TRIGGER IF EXISTS donation_created ON donations;
CREATE TRIGGER donation_created
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_amount();
