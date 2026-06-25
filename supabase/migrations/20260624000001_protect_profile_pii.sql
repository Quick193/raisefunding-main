/*
  Stop leaking profile PII.

  The "Users can view all profiles" RLS policy (USING true) makes every column
  on profiles world-readable via the anon key — including email, phone number,
  and Razorpay account identifiers. RLS is row-level only, so we use
  column-level privileges to keep only the public display name (and id)
  readable, while email / phone / payment-account ids are not selectable by
  the client roles.

  full_name and id stay readable so campaign creator names still resolve.
  These columns are still writable (INSERT/UPDATE) by the existing policies and
  readable server-side via the service role (which bypasses column grants).
*/

-- razorpay_fund_account_id is intentionally left readable: the owner's settings
-- page reads it to show payout status, and it's an opaque token that cannot
-- move money without the platform's RazorpayX credentials.
REVOKE SELECT (email, phone_number, razorpay_account_id, razorpay_contact_id)
  ON public.profiles FROM anon, authenticated;
