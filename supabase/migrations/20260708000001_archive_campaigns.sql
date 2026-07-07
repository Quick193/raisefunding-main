/*
  Archive instead of delete.

  Settled/old campaigns are kept as financial audit records but hidden from the
  public browse listing via archived_at. The purge job sets it; browse queries
  filter it out. Direct links (campaign detail) and the creator's dashboard
  still show the campaign.

  archived_at is server-owned like the other financial/listing columns, so a
  creator can't un-archive (re-list) a purged campaign.
*/

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_campaigns_archived_at ON campaigns(archived_at);

CREATE OR REPLACE FUNCTION protect_campaign_service_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.current_amount := 0;
      NEW.supporter_count := 0;
      NEW.status := 'active';
      NEW.claim_deadline := NULL;
      NEW.withdrawn_at := NULL;
      NEW.is_featured := false;
      NEW.featured_until := NULL;
      NEW.featured_since := NULL;
      NEW.archived_at := NULL;
    ELSE
      NEW.current_amount := OLD.current_amount;
      NEW.supporter_count := OLD.supporter_count;
      NEW.status := OLD.status;
      NEW.claim_deadline := OLD.claim_deadline;
      NEW.withdrawn_at := OLD.withdrawn_at;
      NEW.is_featured := OLD.is_featured;
      NEW.featured_until := OLD.featured_until;
      NEW.featured_since := OLD.featured_since;
      NEW.archived_at := OLD.archived_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
