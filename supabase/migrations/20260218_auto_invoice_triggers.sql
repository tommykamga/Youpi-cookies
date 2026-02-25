-- 1. Relax Invoice Status Constraint to accept all Order statuses
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
-- We remove the check entirely or check against a wider list. 
-- Best to remove it to allow full sync with orders.status which is text/enum.
-- If we want to keep it, we must include: new, preparing, ready, delivered, completed, cancelled, paid, unpaid, draft...
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_status_check') THEN
        ALTER TABLE invoices DROP CONSTRAINT invoices_status_check;
    END IF;
END $$;

-- 2. Function: Auto-create Invoice on Order Insert
CREATE OR REPLACE FUNCTION auto_create_invoice() RETURNS TRIGGER AS $$
BEGIN
    -- Only create if not exists (though ID is usually different)
    -- Start with 'unpaid' if order is new, or sync status? 
    -- User said: "statut_commande = statut_facture (toujours)"
    -- So we copy the status.
    INSERT INTO invoices (id, order_id, status, total_amount, created_at)
    VALUES (
        'FAC-' || to_char(NEW.created_at, 'YYYY') || '-' || substring(NEW.id::text from 1 for 8), -- Generate ID
        NEW.id,
        NEW.status, 
        NEW.total_amount,
        NEW.created_at
    )
    ON CONFLICT (order_id) DO NOTHING; -- Avoid duplicates if retried
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After Insert Order
DROP TRIGGER IF EXISTS trigger_auto_invoice ON orders;
CREATE TRIGGER trigger_auto_invoice
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_create_invoice();


-- 3. Function: Sync Invoice Status -> Order Status
CREATE OR REPLACE FUNCTION sync_invoice_to_order_status() RETURNS TRIGGER AS $$
BEGIN
    -- Update order status when invoice status changes
    -- Prevent infinite recursion by checking if value actually changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE orders
        SET status = NEW.status
        WHERE id = NEW.order_id
        AND status IS DISTINCT FROM NEW.status; -- Only update if different
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After Update Invoice
DROP TRIGGER IF EXISTS trigger_sync_invoice_status ON invoices;
CREATE TRIGGER trigger_sync_invoice_status
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_to_order_status();


-- 4. Function: Sync Order Status -> Invoice Status
CREATE OR REPLACE FUNCTION sync_order_to_invoice_status() RETURNS TRIGGER AS $$
BEGIN
    -- Update invoice status when order status changes
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE invoices
        SET status = NEW.status
        WHERE order_id = NEW.id
        AND status IS DISTINCT FROM NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After Update Order
DROP TRIGGER IF EXISTS trigger_sync_order_status ON orders;
CREATE TRIGGER trigger_sync_order_status
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_to_invoice_status();
