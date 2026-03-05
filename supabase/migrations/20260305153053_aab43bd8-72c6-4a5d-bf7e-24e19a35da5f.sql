CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT,
  birth_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  chart_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  artwork_url TEXT,
  original_cdn_url TEXT,
  art_style TEXT NOT NULL DEFAULT '',
  prompt_used TEXT,
  artwork_analysis JSONB,
  session_id TEXT,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'purchased', 'fulfilled')),
  shopify_checkout_url TEXT,
  order_number TEXT
);

ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.artworks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.artworks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.artworks FOR UPDATE USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on artworks" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');
CREATE POLICY "Allow insert on artworks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artworks');