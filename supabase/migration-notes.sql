-- =============================================
-- Target OS — Notes prospecteur sur les leads
-- Où coller : Supabase → SQL Editor → Run
-- =============================================

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.prospects.notes IS 'Notes libres saisies par le prospecteur';
