-- =============================================
-- Target OS — Colonnes d'enrichissement & IA
-- Table : public.prospects
-- =============================================
-- Où coller : Supabase Dashboard → SQL Editor → New query → Run

-- Données d'enrichissement
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS secteur TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS taille_entreprise TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS chiffre_affaires TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS annee_creation TEXT;

-- Données générées par l'IA
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS analyse_site TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS forces TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS faiblesses TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS proposition_commerciale TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS script_email TEXT;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prospects'
  AND column_name IN (
    'url', 'secteur', 'taille_entreprise', 'chiffre_affaires', 'annee_creation',
    'analyse_site', 'forces', 'faiblesses', 'proposition_commerciale', 'script_email'
  )
ORDER BY column_name;
