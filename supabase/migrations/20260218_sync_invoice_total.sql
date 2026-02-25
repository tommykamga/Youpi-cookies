-- Sync Invoice Total Amount with Order Total Amount
-- When an order's total_amount changes (e.g. adding items), the invoice should reflect this.

CREATE OR REPLACE FUNCTION sync_invoice_total() RETURNS TRIGGER AS $$
BEGIN
    -- Update invoice total if order total changes
    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
        UPDATE invoices
        SET total_amount = NEW.total_amount
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After Update Order Total
DROP TRIGGER IF EXISTS trigger_sync_invoice_total ON orders;
CREATE TRIGGER trigger_sync_invoice_total
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_total();
