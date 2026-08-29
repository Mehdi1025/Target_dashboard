-- =============================================
-- Target OS — ECG Commercial (prospector_logs + Realtime)
-- À exécuter dans Supabase → SQL Editor → Run
-- Prérequis : tables profiles + prospects
-- =============================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Table prospector_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prospector_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  prospect_id UUID REFERENCES public.prospects (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospector_logs_created_at
  ON public.prospector_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospector_logs_profile_id
  ON public.prospector_logs (profile_id);

CREATE INDEX IF NOT EXISTS idx_prospector_logs_action_type
  ON public.prospector_logs (action_type);

CREATE INDEX IF NOT EXISTS idx_prospector_logs_prospect_id
  ON public.prospector_logs (prospect_id);

COMMENT ON TABLE public.prospector_logs IS 'Journal micro-actions prospecteurs — ECG Commercial admin';
COMMENT ON COLUMN public.prospector_logs.action_type IS 'VIEW_LEAD | GENERATE_LINK | COPY_EMAIL | COPY_AUDIT_LINK | APPROVE_LEAD | SAVE_NOTES | OPEN_REPORT | SNIPER_ALERT';

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.prospector_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prospector_logs_insert_prospecteur" ON public.prospector_logs;
DROP POLICY IF EXISTS "prospector_logs_select_admin" ON public.prospector_logs;

-- Prospecteurs : INSERT uniquement (sur leur propre profile_id)
CREATE POLICY "prospector_logs_insert_prospecteur"
  ON public.prospector_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_prospecteur()
    AND profile_id = auth.uid()
  );

-- Admins : SELECT (lecture du feed temps réel)
CREATE POLICY "prospector_logs_select_admin"
  ON public.prospector_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Supabase Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.prospector_logs;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

COMMIT;

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'prospector_logs'
ORDER BY ordinal_position;

SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'prospector_logs';
