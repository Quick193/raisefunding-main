/*
  # Create Raise Crowdfunding Platform Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamptz)
    
    - `campaigns`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `goal_amount` (numeric)
      - `current_amount` (numeric)
      - `image_url` (text)
      - `status` (text) - 'active' or 'completed'
      - `end_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `donations`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns)
      - `donor_name` (text)
      - `donor_email` (text)
      - `amount` (numeric)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and public access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  goal_amount numeric NOT NULL CHECK (goal_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  image_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donations"
  ON donations FOR SELECT
  TO anon, authenticated
  USING (true);

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
      AND campaigns.creator_id = auth.uid()
    )
  );

-- Create function to update campaign amount when donation is made
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET current_amount = current_amount + NEW.amount,
      updated_at = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donations
DROP TRIGGER IF EXISTS donation_created ON donations;
CREATE TRIGGER donation_created
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_amount();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);