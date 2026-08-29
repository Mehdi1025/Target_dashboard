-- =============================================
-- Target OS — Nettoyage définitif table prospects
-- Où coller : Supabase Dashboard → SQL Editor → Run
-- =============================================

-- Optionnel : vider les données de test avant nettoyage
-- TRUNCATE TABLE public.prospects;

-- 1. Ajouter la colonne manquante
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS poste TEXT;

-- 2. Supprimer les colonnes en doublon / obsolètes
ALTER TABLE public.prospects DROP COLUMN IF EXISTS nom_decideur;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS decideur;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS contact_email;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS besoin_identifie;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS score_ia;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS brouillon_email;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS linkedin;

-- 3. Supprimer d'autres doublons possibles (sans erreur si absents)
ALTER TABLE public.prospects DROP COLUMN IF EXISTS nom_complet;
ALTER TABLE public.prospects DROP COLUMN IF EXISTS notes;

-- 4. Vérification : structure finale attendue
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prospects'
ORDER BY ordinal_position;
