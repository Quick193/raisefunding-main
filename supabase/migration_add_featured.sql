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

CREATE OR REPLACE FUNCTION protect_featured_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_featured := false;
      NEW.featured_until := NULL;
    ELSE
      NEW.is_featured := OLD.is_featured;
      NEW.featured_until := OLD.featured_until;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS protect_featured ON campaigns;
CREATE TRIGGER protect_featured
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION protect_featured_columns();
