-- Fix: Authorized roles can update products (including stock updates)

-- 1. Drop the overly restrictive policy
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Authorized roles can update products" ON products;

-- 2. Create the broader policy allowing Gerant, Manager, Commercial, and Production roles
CREATE POLICY "Authorized roles can update products" ON products 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'manager', 'responsable_commerciale', 'commercial', 'vente', 'sales', 'production')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'manager', 'responsable_commerciale', 'commercial', 'vente', 'sales', 'production')));

