-- Motif de rejet admin lors de la validation RDV
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS rdv_rejection_reason TEXT NULL;

COMMENT ON COLUMN public.prospects.rdv_rejection_reason IS
  'Motif admin lors du rejet RDV : INJOIGNABLE, PAS_INTERESSE, FAUX_NUMERO';

DO $$
BEGIN
  ALTER TABLE public.prospects
    ADD CONSTRAINT prospects_rdv_rejection_reason_check
    CHECK (
      rdv_rejection_reason IS NULL
      OR rdv_rejection_reason IN ('INJOIGNABLE', 'PAS_INTERESSE', 'FAUX_NUMERO')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
