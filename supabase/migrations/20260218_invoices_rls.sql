-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any to avoid conflicts
DROP POLICY IF EXISTS "Enable all for authenticated users" ON invoices;

-- Create policy for full access to authenticated users
CREATE POLICY "Enable all for authenticated users" ON invoices
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on customers if not already
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;

-- Create policy for full access to authenticated users
CREATE POLICY "Enable all for authenticated users" ON customers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
