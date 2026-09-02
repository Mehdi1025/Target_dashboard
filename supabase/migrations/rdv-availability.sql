-- =============================================
-- Target OS — Créneaux RDV (disponibilités admin)
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.rdv_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 30
    CHECK (slot_duration_minutes BETWEEN 15 AND 120),
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rdv_availability_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_rdv_availability_day
  ON public.rdv_availability_rules (day_of_week, is_active);

COMMENT ON TABLE public.rdv_availability_rules IS
  'Plages horaires hebdomadaires proposées aux prospecteurs pour booker un RDV';
COMMENT ON COLUMN public.rdv_availability_rules.day_of_week IS
  'ISO 8601 : 1 = lundi … 7 = dimanche';

ALTER TABLE public.rdv_availability_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdv_availability_admin_all" ON public.rdv_availability_rules;
DROP POLICY IF EXISTS "rdv_availability_prospecteur_read" ON public.rdv_availability_rules;

CREATE POLICY "rdv_availability_admin_all"
  ON public.rdv_availability_rules
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rdv_availability_prospecteur_read"
  ON public.rdv_availability_rules
  FOR SELECT
  TO authenticated
  USING (public.is_prospecteur() AND is_active = true);

-- Plages par défaut (lun–ven 9h–12h et 14h–18h, créneaux 30 min)
INSERT INTO public.rdv_availability_rules (day_of_week, start_time, end_time, slot_duration_minutes, label)
SELECT d, t.start_time, t.end_time, 30, t.label
FROM generate_series(1, 5) AS d
CROSS JOIN (
  VALUES
    ('09:00'::time, '12:00'::time, 'Matin'),
    ('14:00'::time, '18:00'::time, 'Après-midi')
) AS t(start_time, end_time, label)
WHERE NOT EXISTS (SELECT 1 FROM public.rdv_availability_rules LIMIT 1);

COMMIT;
