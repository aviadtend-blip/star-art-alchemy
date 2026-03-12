ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS fulfillment_error text,
  ADD COLUMN IF NOT EXISTS canvas_size text,
  ADD COLUMN IF NOT EXISTS prodigi_sku text,
  ADD COLUMN IF NOT EXISTS prodigi_order_id text;

-- shopify_order_id and shopify_order_number already exist on orders table
-- insert_card_url already exists on orders table

-- Create insert-cards storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('insert-cards', 'insert-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on insert-cards bucket
CREATE POLICY "Allow public read on insert-cards"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'insert-cards');

-- Allow service role uploads
CREATE POLICY "Allow service role insert on insert-cards"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'insert-cards');