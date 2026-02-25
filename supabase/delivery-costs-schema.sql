-- Create delivery_costs table
-- Fixed: order_id is TEXT to match orders.id format (CMD-...)

CREATE TABLE IF NOT EXISTS public.delivery_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_date date NOT NULL DEFAULT current_date,
  origin text DEFAULT 'Nkolbong' NOT NULL,
  destination text NOT NULL,
  transport_type text CHECK (transport_type IN ('Moto', 'Taxi')) NOT NULL,
  cost numeric(10,2) NOT NULL CHECK (cost > 0),
  cartons integer CHECK (cartons >= 0),
  driver_name text NOT NULL,
  driver_phone text,
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL, -- Changed from UUID to TEXT
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_date ON public.delivery_costs(delivery_date);
-- Removed idx_delivery_month to avoid IMMUTABLE error with date_trunc

-- RLS
ALTER TABLE public.delivery_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage delivery_costs" ON public.delivery_costs;
CREATE POLICY "Admins manage delivery_costs" ON public.delivery_costs FOR ALL USING (true) WITH CHECK (true);
