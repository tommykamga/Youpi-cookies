-- Create the storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the invoices bucket

-- 1. Allow public read access (necessary for WhatsApp to download the PDF)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'invoices' );

-- 2. Allow authenticated users to upload invoices
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;

CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update their own uploads (optional but good)
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;

CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);
