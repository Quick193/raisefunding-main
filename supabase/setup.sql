/*
  Complete RaiseFunding schema — run this once in a fresh Supabase project.
  SQL Editor → paste → Run.

  Note: profiles.id and campaigns.creator_id are text (not uuid) because
  newer Supabase versions store auth.users.id as text, not uuid.
  campaigns.id and donations.id are uuid (self-generated, no FK to auth).
*/

-- ── clean slate (safe to run on empty project) ────────────────────────────────
DROP TABLE IF EXISTS rate_limits             CASCADE;
DROP TABLE IF EXISTS payout_account_changes  CASCADE;
DROP TABLE IF EXISTS campaign_reports        CASCADE;
DROP TABLE IF EXISTS feature_payments         CASCADE;
DROP TABLE IF EXISTS withdrawals              CASCADE;
DROP TABLE IF EXISTS donations                CASCADE;
DROP TABLE IF EXISTS campaigns                CASCADE;
DROP TABLE IF EXISTS profiles                 CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            text PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  full_name     text NOT NULL,
  phone_number  text,
  razorpay_account_id text,
  razorpay_contact_id text,
  razorpay_fund_account_id text,
  payout_account_updated_at timestamptz,
  payout_account_ready_at timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- ── campaigns ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text NOT NULL,
  goal_amount     numeric NOT NULL,
  current_amount  numeric NOT NULL DEFAULT 0,
  supporter_count integer NOT NULL DEFAULT 0,
  image_url       text,
  video_url       text,
  media           jsonb NOT NULL DEFAULT '[]',
  category        text,
  location        text,
  status          text NOT NULL DEFAULT 'active',
  end_date        timestamptz,
  claim_deadline  timestamptz,
  withdrawn_at    timestamptz,
  is_featured     boolean NOT NULL DEFAULT false,
  featured_until  timestamptz,
  featured_since  timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT campaigns_status_check
    CHECK (status IN ('active', 'completed', 'withdrawal_pending', 'withdrawn', 'refunded')),
  CONSTRAINT campaigns_goal_amount_check
    CHECK (goal_amount BETWEEN 100 AND 100000000),
  CONSTRAINT campaigns_current_amount_check
    CHECK (current_amount >= 0),
  CONSTRAINT campaigns_title_length
    CHECK (char_length(trim(title)) BETWEEN 10 AND 100),
  CONSTRAINT campaigns_description_length
    CHECK (char_length(trim(description)) BETWEEN 50 AND 5000)
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns"
  ON campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Creators can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = creator_id)
  WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Creators can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (auth.uid()::text = creator_id);

-- ── donations ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS donations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_name   text NOT NULL,
  donor_email  text NOT NULL,
  amount       numeric NOT NULL,
  message      text,
  razorpay_order_id    text,
  razorpay_payment_id  text UNIQUE,
  razorpay_transfer_id text,
  status       text NOT NULL DEFAULT 'captured',
  refund_id    text,
  refund_status text,
  refunded_at  timestamptz,
  created_at   timestamptz DEFAULT now(),

  CONSTRAINT donations_amount_check
    CHECK (amount >= 1),
  CONSTRAINT donations_email_format
    CHECK (donor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign creators can view donations for their campaigns"
  ON donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = donations.campaign_id
        AND campaigns.creator_id = auth.uid()::text
    )
  );

-- ── campaign reports ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reporter_email text,
  reason         text NOT NULL,
  status         text NOT NULL DEFAULT 'open',
  created_at     timestamptz DEFAULT now(),
  reviewed_at    timestamptz,

  CONSTRAINT campaign_reports_status_check
    CHECK (status IN ('open', 'reviewed', 'dismissed')),
  CONSTRAINT campaign_reports_reason_length
    CHECK (char_length(reason) BETWEEN 10 AND 5000),
  CONSTRAINT campaign_reports_email_format
    CHECK (reporter_email IS NULL OR reporter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
-- Public report inserts go through the campaign-report Edge Function so server
-- side rate limits cannot be bypassed with direct table writes.

-- ── indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id     ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status         ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category       ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id    ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at     ON donations(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS donations_razorpay_payment_id_key
  ON donations(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_status      ON campaign_reports(status);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_created_at  ON campaign_reports(created_at);

-- ── financial tables ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS withdrawals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        uuid NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  creator_id         text NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  gross_amount       numeric NOT NULL,
  fee_amount         numeric NOT NULL DEFAULT 0,
  net_amount         numeric NOT NULL,
  razorpay_payout_id text,
  status             text NOT NULL DEFAULT 'queued',
  created_at         timestamptz DEFAULT now(),
  processed_at       timestamptz,

  CONSTRAINT withdrawals_status_check
    CHECK (status IN ('queued', 'processing', 'processed', 'failed', 'reversed')),
  CONSTRAINT withdrawals_campaign_unique UNIQUE (campaign_id)
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

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

CREATE POLICY "Creators can view own feature payments"
  ON feature_payments FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_campaign_id ON withdrawals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_feature_payments_campaign_id ON feature_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_feature_payments_creator_id ON feature_payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_claim_deadline ON campaigns(claim_deadline)
  WHERE status = 'completed';

CREATE TABLE IF NOT EXISTS payout_account_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  previous_fund_account_id text,
  new_fund_account_id text NOT NULL,
  razorpay_contact_id text,
  ready_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payout_account_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own payout account changes"
  ON payout_account_changes FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

CREATE INDEX IF NOT EXISTS idx_payout_account_changes_creator_id
  ON payout_account_changes(creator_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  scope text NOT NULL,
  key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON rate_limits(updated_at);

-- ── functions & triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_scope text,
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
  v_key_hash text;
BEGIN
  IF p_scope IS NULL
     OR trim(p_scope) = ''
     OR p_key IS NULL
     OR trim(p_key) = ''
     OR p_max_requests < 1
     OR p_window_seconds < 1 THEN
    RETURN false;
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');

  INSERT INTO rate_limits (scope, key_hash, window_start, count, updated_at)
  VALUES (p_scope, v_key_hash, v_window_start, 1, now())
  ON CONFLICT (scope, key_hash, window_start)
  DO UPDATE SET
    count = rate_limits.count + 1,
    updated_at = now()
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION check_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO service_role;

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
  SET current_amount  = current_amount + p_amount,
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
      updated_at      = now()
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

CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Direct donation inserts are disabled; use record_verified_donation().';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS donation_created ON donations;

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

CREATE TRIGGER prevent_financial_campaign_delete
  BEFORE DELETE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION prevent_financial_campaign_delete();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET phone_number = EXCLUDED.phone_number
    WHERE profiles.phone_number IS NULL OR profiles.phone_number = '';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

REVOKE SELECT (email, phone_number, razorpay_account_id, razorpay_contact_id, razorpay_fund_account_id)
  ON public.profiles FROM anon, authenticated;
