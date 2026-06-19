/*
  Escrow / withdraw / refund model.

  Donations pool in the platform's RazorpayX account. The creator withdraws the
  raised amount on demand (all-or-nothing) → RazorpayX payout → campaign closes.
  If a campaign closes (goal reached or end_date passed) and the creator does
  not withdraw within the 30-day claim window, every donation is refunded.

  Raise charges no platform fee; only Razorpay's processing cost is passed
  through at withdrawal.
*/

-- ── campaign statuses + escrow fields ─────────────────────────────────────────
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('active', 'completed', 'withdrawn', 'refunded'));

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS claim_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at   timestamptz;

-- ── payout target on the creator's profile (RazorpayX contact + fund account) ──
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS razorpay_contact_id      text,
  ADD COLUMN IF NOT EXISTS razorpay_fund_account_id text;

-- ── refund tracking on each donation ──────────────────────────────────────────
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS refund_id     text,
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refunded_at   timestamptz;

-- ── withdrawals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id         text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gross_amount       numeric NOT NULL,
  fee_amount         numeric NOT NULL DEFAULT 0,
  net_amount         numeric NOT NULL,
  razorpay_payout_id text,
  status             text NOT NULL DEFAULT 'queued',
  created_at         timestamptz DEFAULT now(),
  processed_at       timestamptz,

  CONSTRAINT withdrawals_status_check
    CHECK (status IN ('queued', 'processing', 'processed', 'failed', 'reversed')),
  -- one withdrawal per campaign (all-or-nothing closes the campaign)
  CONSTRAINT withdrawals_campaign_unique UNIQUE (campaign_id)
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid()::text = creator_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_campaign_id ON withdrawals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_claim_deadline ON campaigns(claim_deadline)
  WHERE status = 'completed';

-- ── stamp the 30-day claim window when a goal is reached ──────────────────────
-- Extends the donation trigger: when a donation funds the goal, close the
-- campaign and start the claim window. (Campaigns that close by end_date are
-- stamped by the daily scheduler instead.)
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET current_amount  = current_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      status = CASE
                 WHEN current_amount + NEW.amount >= goal_amount THEN 'completed'
                 ELSE status
               END,
      claim_deadline = CASE
                 WHEN current_amount + NEW.amount >= goal_amount AND status = 'active'
                   THEN now() + interval '30 days'
                 ELSE claim_deadline
               END,
      updated_at      = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
