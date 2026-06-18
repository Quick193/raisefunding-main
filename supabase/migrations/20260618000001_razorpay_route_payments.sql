/*
  Razorpay Route — payments schema.

  - profiles.razorpay_account_id : the creator's Route linked account (acc_...).
  - donations payment columns    : tie each donation to a real Razorpay payment.
  - donations are now written server-side ONLY (after signature verification),
    so the previously-open public INSERT policy is revoked.
*/

-- ── profiles: linked account ──────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS razorpay_account_id text;

-- ── donations: Razorpay references ────────────────────────────────────────────
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS razorpay_order_id    text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id  text,
  ADD COLUMN IF NOT EXISTS razorpay_transfer_id text,
  ADD COLUMN IF NOT EXISTS status               text NOT NULL DEFAULT 'captured';

-- Idempotency: a given Razorpay payment can only ever record one donation, so a
-- retried webhook / double client callback can't double-count a campaign total.
-- NOTE: must be a NON-partial unique index. Postgres can't use a partial index
-- for ON CONFLICT inference unless the predicate is repeated (which PostgREST
-- does not do), and NULLs are distinct anyway so a plain unique index is safe.
CREATE UNIQUE INDEX IF NOT EXISTS donations_razorpay_payment_id_key
  ON donations(razorpay_payment_id);

-- ── lock down inserts ─────────────────────────────────────────────────────────
-- Real money means a donation row may only exist once a payment is verified.
-- Edge functions write with the service role (which bypasses RLS), so we drop
-- the open client INSERT policy entirely. SELECT policy is unchanged.
DROP POLICY IF EXISTS "Anyone can create donations" ON donations;
