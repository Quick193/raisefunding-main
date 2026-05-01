/*
  Supabase Storage setup for campaign media (images).
  Run this ONCE in the Supabase SQL Editor after setup.sql.
*/

-- Create the public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload campaign media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'campaign-media');

-- Allow anyone to view
CREATE POLICY "Anyone can view campaign media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'campaign-media');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete campaign media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'campaign-media');
