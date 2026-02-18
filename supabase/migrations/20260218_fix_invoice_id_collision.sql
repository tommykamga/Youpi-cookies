-- Fix Invoice ID Collision
-- The previous logic took substring(id, 1, 8) which caused duplicates for orders on the same day/year.
-- New logic: Replace 'CMD-' with 'FAC-' to ensure 1:1 uniqueness with Order ID.

CREATE OR REPLACE FUNCTION auto_create_invoice() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO invoices (id, order_id, status, total_amount, created_at)
    VALUES (
        -- Convert CMD-20260218-XXXX -> FAC-20260218-XXXX
        'FAC-' || substring(NEW.id from 5), 
        NEW.id,
        NEW.status,
        NEW.total_amount,
        NEW.created_at
    )
    ON CONFLICT (order_id) DO NOTHING; -- Avoid duplicates if retried
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
