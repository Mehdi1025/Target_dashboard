-- =============================================
-- Target OS — Quota & Primes (Bounty / RDV)
-- À exécuter dans Supabase → SQL Editor → Run
-- =============================================

BEGIN;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS rdv_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (rdv_status IN ('NONE', 'PENDING', 'VALIDATED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS rdv_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_earned NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prospects_rdv_status ON public.prospects (rdv_status);
CREATE INDEX IF NOT EXISTS idx_prospects_rdv_date ON public.prospects (rdv_date DESC NULLS LAST);

COMMENT ON COLUMN public.prospects.rdv_status IS 'NONE | PENDING (déclaré) | VALIDATED (admin) | REJECTED';
COMMENT ON COLUMN public.prospects.rdv_date IS 'Date de booking / réalisation du RDV';
COMMENT ON COLUMN public.prospects.deal_amount IS 'Montant contrat si converti';
COMMENT ON COLUMN public.prospects.commission_earned IS 'Commission 10% calculée sur deal_amount';

COMMIT;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prospects'
  AND column_name IN ('rdv_status', 'rdv_date', 'deal_amount', 'commission_earned');
