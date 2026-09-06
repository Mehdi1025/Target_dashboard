-- Numéro de téléphone sur les leads (ingestion n8n + affichage dashboard)
-- Supabase → SQL Editor → Run

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS telephone TEXT;

COMMENT ON COLUMN public.prospects.telephone IS
  'Numéro de téléphone du contact — renseigné par n8n ou saisi manuellement';
