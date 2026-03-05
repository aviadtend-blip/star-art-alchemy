-- Add columns needed for post-checkout upscaling pipeline
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS apiframe_task_id TEXT;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS upscaled_url TEXT;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS upscale_status TEXT DEFAULT NULL
  CHECK (upscale_status IS NULL OR upscale_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;
