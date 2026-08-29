-- Ajoute la colonne pour le rapport HTML généré par n8n
-- Supabase → SQL Editor → Run

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS html_rapport TEXT;

COMMENT ON COLUMN public.prospects.html_rapport IS
  'Rapport HTML complet (style Awwards) généré par le workflow n8n';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prospects'
  AND column_name = 'html_rapport';
