CREATE POLICY "Allow public uploads to user-photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Allow public read from user-photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'user-photos');