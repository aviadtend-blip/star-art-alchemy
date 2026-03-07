
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read user-photos' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read user-photos" ON storage.objects FOR SELECT USING (bucket_id = 'user-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload user-photos' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Anon upload user-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-photos');
  END IF;
END $$;
