-- Enable ON DELETE CASCADE for invoices.order_id
-- This ensures that when an order is deleted, the associated invoice is also deleted automatically.

-- 1. Drop existing FK constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_order_id_fkey;

-- 2. Re-create FK constraint with ON DELETE CASCADE
ALTER TABLE invoices
    ADD CONSTRAINT invoices_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE;
