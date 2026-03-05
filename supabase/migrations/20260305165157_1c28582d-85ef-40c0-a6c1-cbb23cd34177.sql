ALTER TABLE public.artworks 
  ADD COLUMN IF NOT EXISTS shopify_order_id text,
  ADD COLUMN IF NOT EXISTS upscale_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS upscaled_url text,
  ADD COLUMN IF NOT EXISTS apiframe_task_id text;