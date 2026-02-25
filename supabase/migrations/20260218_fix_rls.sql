
-- Fix RLS Policies
-- Currently, RLS seems to be blocking access to orders and invoices for authenticated users.

-- 1. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
CREATE POLICY "Enable read access for authenticated users" ON orders
    FOR SELECT
    TO authenticated
    USING (true); -- Or USING (auth.uid() = user_id) if you have user ownership implemented

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;
CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON orders;
CREATE POLICY "Enable delete for authenticated users" ON orders
    FOR DELETE
    TO authenticated
    USING (true);


-- 2. INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON invoices;
CREATE POLICY "Enable read access for authenticated users" ON invoices
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON invoices;
CREATE POLICY "Enable insert for authenticated users" ON invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON invoices;
CREATE POLICY "Enable update for authenticated users" ON invoices
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON invoices;
CREATE POLICY "Enable delete for authenticated users" ON invoices
    FOR DELETE
    TO authenticated
    USING (true);

-- 3. ORDER ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON order_items;
CREATE POLICY "Enable read access for authenticated users" ON order_items
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_items;
CREATE POLICY "Enable insert for authenticated users" ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON order_items;
CREATE POLICY "Enable update for authenticated users" ON order_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON order_items;
CREATE POLICY "Enable delete for authenticated users" ON order_items
    FOR DELETE
    TO authenticated
    USING (true);
