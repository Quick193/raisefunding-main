/*
  Complete RaiseFunding schema — run this once in a fresh Supabase project.
  SQL Editor → paste → Run.

  Note: profiles.id and campaigns.creator_id are text (not uuid) because
  newer Supabase versions store auth.users.id as text, not uuid.
  campaigns.id and donations.id are uuid (self-generated, no FK to auth).
*/

-- ── clean slate (safe to run on empty project) ────────────────────────────────
DROP TABLE IF EXISTS donations  CASCADE;
DROP TABLE IF EXISTS campaigns  CASCADE;
DROP TABLE IF EXISTS profiles   CASCADE;

-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            text PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  full_name     text NOT NULL,
  phone_number  text,
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
  category        text,
  location        text,
  status          text NOT NULL DEFAULT 'active',
  end_date        timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT campaigns_status_check
    CHECK (status IN ('active', 'completed')),
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
  created_at   timestamptz DEFAULT now(),

  CONSTRAINT donations_amount_check
    CHECK (amount >= 1),
  CONSTRAINT donations_email_format
    CHECK (donor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create donations"
  ON donations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- ── indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id     ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status         ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category       ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id    ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at     ON donations(created_at);

-- ── functions & triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET current_amount  = current_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      updated_at      = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS donation_created ON donations;
CREATE TRIGGER donation_created
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_amount();

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
