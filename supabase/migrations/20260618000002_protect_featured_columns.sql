/*
  Lock down featuring so it can only happen through a verified payment.

  The "Creators can update own campaigns" RLS policy lets a creator update any
  column on their own campaign — including is_featured / featured_until /
  featured_since. That means a technical user could feature for free with a
  direct UPDATE, bypassing Razorpay.

  RLS is row-level, not column-level, so we guard these columns with a trigger:
  client roles (anon, authenticated) cannot change them — any attempt is
  silently reverted to the existing values. The edge functions write with the
  service role, which is exempt, so paid featuring still works.
*/

CREATE OR REPLACE FUNCTION protect_featured_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Only the client-facing roles are restricted. service_role / postgres
  -- (edge functions, migrations, SQL editor) may set these freely.
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.is_featured   := OLD.is_featured;
    NEW.featured_until := OLD.featured_until;
    NEW.featured_since := OLD.featured_since;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_featured ON campaigns;
CREATE TRIGGER protect_featured
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION protect_featured_columns();
