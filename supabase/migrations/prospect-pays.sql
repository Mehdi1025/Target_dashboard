-- Pays du lead (CH / FR) — backfill Suisse pour l'existant, n8n envoie pays pour les nouveaux
-- Supabase → SQL Editor → Run

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS pays TEXT;

COMMENT ON COLUMN public.prospects.pays IS
  'Pays du lead : CH (Suisse) ou FR (France). Renseigné par n8n ou le prospecteur.';

-- Tous les leads actuels = Suisse
UPDATE public.prospects
SET pays = 'CH'
WHERE pays IS NULL;

ALTER TABLE public.prospects
  DROP CONSTRAINT IF EXISTS prospects_pays_check;

ALTER TABLE public.prospects
  ADD CONSTRAINT prospects_pays_check
  CHECK (pays IS NULL OR pays IN ('CH', 'FR'));

-- Vérification
SELECT pays, COUNT(*) AS total
FROM public.prospects
GROUP BY pays
ORDER BY pays;
