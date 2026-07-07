/*
  Supabase Storage setup for campaign media (images).
  Run this ONCE in the Supabase SQL Editor after setup.sql.
*/

-- Create the public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload only under their own prefix:
-- campaigns/{auth.uid()}/...
DROP POLICY IF EXISTS "Authenticated users can upload campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own campaign media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own campaign media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] IN ('covers', 'gallery', 'videos')
    AND (
      ((storage.foldername(name))[3] IN ('covers', 'gallery') AND lower(name) ~ '\.(jpg|jpeg|png|webp|gif)$')
      OR ((storage.foldername(name))[3] = 'videos' AND lower(name) ~ '\.(mp4|mov|webm)$')
    )
  );

-- Allow anyone to view
CREATE POLICY "Anyone can view campaign media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'campaign-media');

-- Allow authenticated users to delete only their own uploads
DROP POLICY IF EXISTS "Authenticated users can delete campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own campaign media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own campaign media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND (storage.foldername(name))[3] IN ('covers', 'gallery', 'videos')
  );
