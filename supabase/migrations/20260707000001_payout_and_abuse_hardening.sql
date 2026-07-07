/*
  Hardening for payout-account changes, withdrawal finality, and anonymous abuse.

  - Payout destination changes are audited and held behind a cooling-off period.
  - Campaigns can sit in withdrawal_pending while RazorpayX finalizes payout.
  - Anonymous donation-order/report traffic is rate limited server-side.
  - Public direct report inserts are disabled; reports must go through the
    campaign-report Edge Function so rate limiting cannot be bypassed.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payout_account_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_account_ready_at timestamptz;

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

DROP POLICY IF EXISTS "Creators can view own payout account changes" ON payout_account_changes;
CREATE POLICY "Creators can view own payout account changes"
  ON payout_account_changes FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

CREATE INDEX IF NOT EXISTS idx_payout_account_changes_creator_id
  ON payout_account_changes(creator_id, created_at DESC);

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('active', 'completed', 'withdrawal_pending', 'withdrawn', 'refunded'));

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

DROP POLICY IF EXISTS "Anyone can create campaign reports" ON campaign_reports;
