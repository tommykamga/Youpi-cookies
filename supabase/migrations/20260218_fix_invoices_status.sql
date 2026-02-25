-- Relax constraint on invoice status to allow standard values
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
CHECK (status IN ('draft', 'pending', 'unpaid', 'paid', 'cancelled', 'overdue'));
