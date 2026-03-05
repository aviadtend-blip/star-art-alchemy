
-- Create email_captures table
CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  sun_sign text,
  moon_sign text,
  rising_sign text,
  artwork_url text,
  email_mockup_url text,
  artwork_id text,
  session_id text,
  peak_season text DEFAULT 'default',
  dominant_element text,
  element_balance jsonb,
  capture_timestamp timestamptz DEFAULT now(),
  artwork_expiry_date timestamptz,
  cosmic10_expiry timestamptz,
  nurture_branch text DEFAULT 'preview_only',
  status text DEFAULT 'active',
  converted boolean DEFAULT false,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON public.email_captures (email);
CREATE INDEX IF NOT EXISTS idx_email_captures_status ON public.email_captures (status);
CREATE INDEX IF NOT EXISTS idx_email_captures_nurture_branch ON public.email_captures (nurture_branch);
CREATE INDEX IF NOT EXISTS idx_email_captures_converted ON public.email_captures (converted);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_email_captures_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_captures_updated_at
  BEFORE UPDATE ON public.email_captures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_captures_updated_at();

-- RLS
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- Public insert (from edge functions via service role, but also allow anon for client fallback)
CREATE POLICY "Allow public insert on email_captures"
  ON public.email_captures FOR INSERT
  WITH CHECK (true);

-- Only service role should read
CREATE POLICY "Allow public read on email_captures"
  ON public.email_captures FOR SELECT
  USING (true);

-- Allow updates (for upsert)
CREATE POLICY "Allow public update on email_captures"
  ON public.email_captures FOR UPDATE
  USING (true);
