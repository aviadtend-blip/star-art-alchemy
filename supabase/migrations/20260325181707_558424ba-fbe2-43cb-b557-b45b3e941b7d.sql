INSERT INTO storage.buckets (id, name, public)
VALUES ('fonts', 'fonts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public font read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fonts');