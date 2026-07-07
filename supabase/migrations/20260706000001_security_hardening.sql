/*
  Security hardening for live payments.

  - Record verified donations atomically with a campaign row lock so concurrent
    payments cannot push a campaign past its goal.
  - Store featured-placement payments with a unique Razorpay payment id so one
    payment cannot be replayed across multiple campaigns.
  - Keep financial records after payout instead of deleting campaigns.
  - Restrict campaign-media writes/deletes to user-owned path prefixes.
  - Keep campaign financial, settlement, and featured-placement fields
    server-owned even though creators can edit ordinary campaign content.
*/

-- Direct donation writes are already blocked for client roles. From this point
-- on, privileged code must use record_verified_donation() so totals and rows are
-- updated in one transaction.
DROP TRIGGER IF EXISTS donation_created ON donations;

CREATE OR REPLACE FUNCTION record_verified_donation(
  p_campaign_id uuid,
  p_donor_name text,
  p_donor_email text,
  p_amount numeric,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
RETURNS jsonb AS $$
DECLARE
  v_campaign campaigns%ROWTYPE;
  v_existing donations%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_campaign_id IS NULL
     OR p_amount IS NULL
     OR p_amount < 1
     OR p_razorpay_payment_id IS NULL
     OR p_razorpay_payment_id = '' THEN
    RAISE EXCEPTION 'Invalid donation payload';
  END IF;

  SELECT * INTO v_existing
  FROM donations
  WHERE razorpay_payment_id = p_razorpay_payment_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'inserted', false,
      'campaign_id', v_existing.campaign_id,
      'amount', v_existing.amount
    );
  END IF;

  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'This campaign is closed to new donations.';
  END IF;

  IF v_campaign.end_date IS NOT NULL AND v_campaign.end_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'This campaign is closed to new donations.';
  END IF;

  IF COALESCE(v_campaign.current_amount, 0) + p_amount > v_campaign.goal_amount THEN
    RAISE EXCEPTION 'This donation exceeds the remaining campaign goal.';
  END IF;

  INSERT INTO donations (
    campaign_id,
    donor_name,
    donor_email,
    amount,
    razorpay_order_id,
    razorpay_payment_id,
    status
  )
  VALUES (
    p_campaign_id,
    COALESCE(NULLIF(trim(p_donor_name), ''), 'Anonymous'),
    p_donor_email,
    p_amount,
    p_razorpay_order_id,
    p_razorpay_payment_id,
    'captured'
  )
  RETURNING * INTO v_existing;

  UPDATE campaigns
  SET current_amount = current_amount + p_amount,
      supporter_count = supporter_count + 1,
      status = CASE
        WHEN current_amount + p_amount >= goal_amount THEN 'completed'
        ELSE status
      END,
      claim_deadline = CASE
        WHEN current_amount + p_amount >= goal_amount AND status = 'active'
          THEN v_now + interval '30 days'
        ELSE claim_deadline
      END,
      updated_at = v_now
  WHERE id = p_campaign_id;

  RETURN jsonb_build_object(
    'success', true,
    'inserted', true,
    'campaign_id', p_campaign_id,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION record_verified_donation(uuid, text, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_verified_donation(uuid, text, text, numeric, text, text) TO service_role;

CREATE TABLE IF NOT EXISTS feature_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  creator_id text NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  razorpay_order_id text NOT NULL,
  razorpay_payment_id text NOT NULL UNIQUE,
  amount_paise integer NOT NULL,
  days integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT feature_payments_days_check CHECK (days IN (7, 30, 90)),
  CONSTRAINT feature_payments_amount_check CHECK (amount_paise > 0)
);

ALTER TABLE feature_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view own feature payments" ON feature_payments;
CREATE POLICY "Creators can view own feature payments"
  ON feature_payments FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

CREATE INDEX IF NOT EXISTS idx_feature_payments_campaign_id ON feature_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_feature_payments_creator_id ON feature_payments(creator_id);

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
    ELSE
      NEW.current_amount := OLD.current_amount;
      NEW.supporter_count := OLD.supporter_count;
      NEW.status := OLD.status;
      NEW.claim_deadline := OLD.claim_deadline;
      NEW.withdrawn_at := OLD.withdrawn_at;
      NEW.is_featured := OLD.is_featured;
      NEW.featured_until := OLD.featured_until;
      NEW.featured_since := OLD.featured_since;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS protect_featured ON campaigns;
DROP TRIGGER IF EXISTS protect_campaign_service_columns ON campaigns;
CREATE TRIGGER protect_campaign_service_columns
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION protect_campaign_service_columns();

CREATE OR REPLACE FUNCTION prevent_financial_campaign_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM donations WHERE campaign_id = OLD.id)
     OR EXISTS (SELECT 1 FROM withdrawals WHERE campaign_id = OLD.id)
     OR EXISTS (SELECT 1 FROM feature_payments WHERE campaign_id = OLD.id) THEN
    RAISE EXCEPTION 'Campaigns with financial records cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_financial_campaign_delete ON campaigns;
CREATE TRIGGER prevent_financial_campaign_delete
  BEFORE DELETE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION prevent_financial_campaign_delete();

-- Public report submissions must enter the moderation queue as new reports.
-- Otherwise an anonymous caller can insert status='dismissed' or an old
-- created_at value and bypass normal review workflows.
DROP POLICY IF EXISTS "Anyone can create campaign reports" ON campaign_reports;
CREATE POLICY "Anyone can create campaign reports"
  ON campaign_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'open'
    AND reviewed_at IS NULL
    AND created_at >= now() - interval '5 minutes'
    AND created_at <= now() + interval '5 minutes'
  );

-- Preserve the function name expected by older migrations/scripts, but make it a
-- guard rail: service code should call record_verified_donation() instead.
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Direct donation inserts are disabled; use record_verified_donation().';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Storage hardening. New uploads are stored as:
-- campaigns/{auth.uid()}/{covers|gallery|videos}/...
DROP POLICY IF EXISTS "Authenticated users can upload campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own campaign media" ON storage.objects;

CREATE POLICY "Authenticated users can upload own campaign media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] IN ('covers', 'gallery', 'videos')
    AND (
      ((storage.foldername(name))[3] IN ('covers', 'gallery') AND lower(name) ~ '\.(jpg|jpeg|png|webp|gif)$')
      OR ((storage.foldername(name))[3] = 'videos' AND lower(name) ~ '\.(mp4|mov|webm)$')
    )
  );

CREATE POLICY "Authenticated users can delete own campaign media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] IN ('covers', 'gallery', 'videos')
  );
