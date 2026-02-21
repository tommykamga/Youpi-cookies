-- Enable ON DELETE CASCADE for delivery_costs.order_id
-- This ensures that when an order is deleted, the associated delivery cost is also deleted automatically.

-- 1. Drop existing FK constraint
ALTER TABLE public.delivery_costs DROP CONSTRAINT IF EXISTS delivery_costs_order_id_fkey;

-- 2. Re-create FK constraint with ON DELETE CASCADE
ALTER TABLE public.delivery_costs
    ADD CONSTRAINT delivery_costs_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES public.orders(id)
    ON DELETE CASCADE;
