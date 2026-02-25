-- Drop the view first because it depends on the cartons column
DROP VIEW IF EXISTS public.delivery_stats_view;

-- Change cartons column type to numeric
ALTER TABLE public.delivery_costs ALTER COLUMN cartons TYPE numeric(10,2);

-- Recreate the view
CREATE OR REPLACE VIEW public.delivery_stats_view AS
SELECT 
  date_trunc('month', delivery_date) as mois,
  COUNT(*) as nb_livraisons,
  SUM(cost) as total_frais,
  SUM(cartons) as total_cartons,
  CASE 
    WHEN SUM(cartons) > 0 THEN SUM(cost) / SUM(cartons) 
    ELSE 0 
  END as cout_carton,
  STRING_AGG(DISTINCT driver_name, ', ') as prestataires
FROM public.delivery_costs 
GROUP BY date_trunc('month', delivery_date)
ORDER BY date_trunc('month', delivery_date) DESC;

-- Grant access
GRANT SELECT ON public.delivery_stats_view TO authenticated;
GRANT SELECT ON public.delivery_stats_view TO service_role;
