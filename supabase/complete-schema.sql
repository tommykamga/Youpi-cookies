-- YOUPI COOKIES - COMPLETE SUPABASE SCHEMA
-- Execute this script in the Supabase SQL Editor

-- ==========================================
-- 1. EXTENSIONS & CLEANUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Uncomment if you want a clean start
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- PROFILES (Users + Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK (role IN ('SUPER_ADMIN', 'GERANT', 'RESPONSABLE_COMMERCIALE', 'PRODUCTION', 'PREPARATEUR', 'VENTE')) DEFAULT 'VENTE',
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  alert_threshold INTEGER DEFAULT 10,
  unit TEXT, -- e.g., '110g', '220g'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CUSTOMERS (Clients)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company_name TEXT,
  tax_id TEXT, -- NIU/RC
  niu TEXT,
  rc TEXT,
  website TEXT,
  category TEXT CHECK (category IN ('CLIENT', 'FOURNISSEUR', 'PROSPECT', 'ANNUAIRE')) DEFAULT 'CLIENT',
  balance NUMERIC(15,2) DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY, -- Format: CMD-YYYYMMDD-XXXX
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'invoiced', 'advance', 'paid')) DEFAULT 'new',
  delivery_date DATE,
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INVOICES (Optional linking)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY, -- Format: FAC-YYYYMMDD-XXXX
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  total_amount NUMERIC(15,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'void')) DEFAULT 'draft',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STOCK MOVEMENTS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL, -- Positive for IN, Negative for OUT
  type TEXT CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE')) NOT NULL,
  reference_id TEXT, -- Linked Order ID or Task ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASKS (Planning)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  related_type TEXT, -- 'order', 'client', 'stock'
  related_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPLOYEES (RH)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Optional link to login account
  fullName TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  hireDate DATE NOT NULL DEFAULT CURRENT_DATE,
  exitDate DATE,
  salary NUMERIC(15,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPLOYEE PAYMENTS (Salary History)
CREATE TABLE IF NOT EXISTS public.employee_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 4. NEW USER TRIGGER (Profiles Creation)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, fullName, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'VENTE')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

-- Base Policies (Example: All authenticated users can Read)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Any authenticated user can insert products" ON products;
CREATE POLICY "Any authenticated user can insert products" ON products 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

DROP POLICY IF EXISTS "Customers are viewable by authenticated users" ON customers;
CREATE POLICY "Customers are viewable by authenticated users" ON customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Any authenticated user can insert customers" ON customers;
CREATE POLICY "Any authenticated user can insert customers" ON customers 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Commercials and Admins can update customers" ON customers;
CREATE POLICY "Commercials and Admins can update customers" ON customers FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial')));

DROP POLICY IF EXISTS "Commercials and Admins can delete customers" ON customers;
CREATE POLICY "Commercials and Admins can delete customers" ON customers FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial')));

-- Simplification radicale pour diagnostic de visibilité
DROP POLICY IF EXISTS "Orders are viewable by authenticated users" ON orders;
CREATE POLICY "Orders are viewable by authenticated users" ON orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and Sales can insert orders" ON orders;
CREATE POLICY "Admins and Sales can insert orders" ON orders 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')));

DROP POLICY IF EXISTS "Admins and Sales can update orders" ON orders;
CREATE POLICY "Admins and Sales can update orders" ON orders 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')));

DROP POLICY IF EXISTS "Admins and Sales can delete orders" ON orders;
CREATE POLICY "Admins and Sales can delete orders" ON orders 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')));

DROP POLICY IF EXISTS "Order items are viewable by authenticated users" ON order_items;
CREATE POLICY "Order items are viewable by authenticated users" ON order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and Sales can manage order items" ON order_items;
CREATE POLICY "Admins and Sales can manage order items" ON order_items 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'responsable_commerciale', 'commercial', 'vente', 'sales')));

-- TASKS
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON tasks;
CREATE POLICY "Tasks are viewable by authenticated users" ON tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Tasks can be managed by authenticated users" ON tasks;
CREATE POLICY "Tasks can be managed by authenticated users" ON tasks FOR ALL TO authenticated USING (true);

-- STOCK MOVEMENTS
DROP POLICY IF EXISTS "Stock movements are viewable by authenticated users" ON stock_movements;
CREATE POLICY "Stock movements are viewable by authenticated users" ON stock_movements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Stock movements can be managed by authorized roles" ON stock_movements;
CREATE POLICY "Stock movements can be managed by authorized roles" ON stock_movements FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'production', 'vente', 'sales')));

-- RH (Restricted)
DROP POLICY IF EXISTS "Employees are viewable by authorized roles" ON employees;
CREATE POLICY "Employees are viewable by authorized roles" ON employees FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

DROP POLICY IF EXISTS "Employees can be managed by authorized roles" ON employees;
CREATE POLICY "Employees can be managed by authorized roles" ON employees FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

-- PAYMENTS
DROP POLICY IF EXISTS "Payments are viewable by authorized roles" ON employee_payments;
CREATE POLICY "Payments are viewable by authorized roles" ON employee_payments FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

DROP POLICY IF EXISTS "Payments can be managed by authorized roles" ON employee_payments;
CREATE POLICY "Payments can be managed by authorized roles" ON employee_payments FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin')));

-- STORAGE (product-images bucket)
-- Note: These policies apply to the storage.objects table
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
CREATE POLICY "Authenticated Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated Manage Access" ON storage.objects;
CREATE POLICY "Authenticated Manage Access" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images');

-- ==========================================
-- 6. DELIVERY COSTS
-- ==========================================
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
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_date ON public.delivery_costs(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_month ON public.delivery_costs(date_trunc('month', delivery_date));

ALTER TABLE public.delivery_costs ENABLE ROW LEVEL SECURITY;
-- Using broad policy for simplest implementation as requested
CREATE POLICY "Admins manage delivery_costs" ON public.delivery_costs FOR ALL USING (true) WITH CHECK (true);

