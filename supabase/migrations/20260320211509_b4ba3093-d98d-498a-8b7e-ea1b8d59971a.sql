ALTER TABLE orders ADD COLUMN IF NOT EXISTS digital_download_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'canvas';