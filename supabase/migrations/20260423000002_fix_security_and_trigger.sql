/*
  # Fix security gaps and update auth trigger

  1. Donations RLS — remove public PII exposure
     The "Anyone can view donations" policy exposes donor names and emails to
     the whole internet. Replace it with a policy that lets only the campaign
     creator see donations for their campaigns, while still allowing anyone to
     insert (so anonymous donors work).

  2. Profiles RLS — tighten the overly permissive INSERT policy
     "System can create profiles" used WITH CHECK (true), meaning any request
     could insert any profile row. The auth trigger is SECURITY DEFINER so it
     bypasses RLS anyway; the frontend upsert runs as the authenticated user so
     it only needs CHECK (auth.uid() = id).

  3. Update handle_new_user() to also store phone_number from user metadata.
*/

-- ── donations RLS ─────────────────────────────────────────────────────────────

-- Drop the policy that exposes all donor PII publicly
DROP POLICY IF EXISTS "Anyone can view donations" ON donations;

-- Campaign creators may view their own campaigns' donations
-- (the more specific policy already exists; recreate it cleanly)
DROP POLICY IF EXISTS "Campaign creators can view donations for their campaigns" ON donations;

CREATE POLICY "Campaign creators can view donations for their campaigns"
  ON donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = donations.campaign_id
        AND campaigns.creator_id = auth.uid()
    )
  );

-- ── profiles RLS ──────────────────────────────────────────────────────────────

-- Drop the overly permissive policy added by fix_profiles_rls migration
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

-- Authenticated users may insert only their own profile row
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── handle_new_user trigger ───────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number)
  VALUES (
    NEW.id,
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
