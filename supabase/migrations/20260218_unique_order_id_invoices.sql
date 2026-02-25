-- Add UNIQUE constraint to order_id on invoices table
-- This is NECESSARY for the auto-invoice function's "ON CONFLICT (order_id)" clause to work.

ALTER TABLE invoices ADD CONSTRAINT invoices_order_id_key UNIQUE (order_id);
