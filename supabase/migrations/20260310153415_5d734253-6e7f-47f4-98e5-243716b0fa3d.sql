
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text,
  shopify_order_number text,
  customer_email text NOT NULL,
  chart_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  artwork_analysis jsonb,
  generated_image_url text NOT NULL,
  subject_explanation text,
  insert_card_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on orders"
  ON public.orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update on orders"
  ON public.orders
  FOR UPDATE
  TO public
  USING (true);
