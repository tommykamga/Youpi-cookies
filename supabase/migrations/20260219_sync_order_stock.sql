-- Drop existing if any
DROP TRIGGER IF EXISTS trigger_sync_order_stock ON public.order_items;
DROP FUNCTION IF EXISTS public.sync_product_stock_on_order();

-- Create the function
CREATE OR REPLACE FUNCTION public.sync_product_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS so the stock can be updated by anyone allowed to edit orders
AS $$
BEGIN
    -- Scenario 1: A new order item is INSERTED
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.products
        SET 
            stock = stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;

    -- Scenario 2: An order item is DELETED
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.products
        SET 
            stock = stock + OLD.quantity,
            updated_at = NOW()
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;

    -- Scenario 3: An order item is UPDATED (e.g. quantity changes)
    IF (TG_OP = 'UPDATE') THEN
        -- Only if the quantity actually changed
        IF (NEW.quantity <> OLD.quantity) THEN
            UPDATE public.products
            SET 
                -- We add back the old quantity, and subtract the new quantity
                stock = stock + OLD.quantity - NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_id;
        END IF;
        
        -- If the product changed completely (deleted old, inserted new)
        IF (NEW.product_id <> OLD.product_id) THEN
            -- Restore old product
            UPDATE public.products
            SET stock = stock + OLD.quantity, updated_at = NOW()
            WHERE id = OLD.product_id;
            
            -- Deduct new product
            UPDATE public.products
            SET stock = stock - NEW.quantity, updated_at = NOW()
            WHERE id = NEW.product_id;
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

-- Attach the trigger to the order_items table
CREATE TRIGGER trigger_sync_order_stock
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_product_stock_on_order();
