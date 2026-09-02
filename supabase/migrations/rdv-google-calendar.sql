-- =============================================
-- Target OS — Google Calendar (agenda Adam / admin)
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.rdv_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  google_refresh_token TEXT,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_connected_email TEXT,
  google_connected_at TIMESTAMPTZ,
  google_booking_url TEXT NOT NULL DEFAULT 'https://calendar.app.google/jq8dJH2LtunSEPsz7',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.rdv_calendar_settings IS
  'Connexion Google Calendar de l''admin (Adam) — créneaux filtrés selon son agenda';

ALTER TABLE public.rdv_calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdv_calendar_settings_admin_all" ON public.rdv_calendar_settings;

CREATE POLICY "rdv_calendar_settings_admin_all"
  ON public.rdv_calendar_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.rdv_calendar_settings (singleton_key, google_booking_url)
VALUES ('default', 'https://calendar.app.google/jq8dJH2LtunSEPsz7')
ON CONFLICT (singleton_key) DO NOTHING;

COMMIT;
