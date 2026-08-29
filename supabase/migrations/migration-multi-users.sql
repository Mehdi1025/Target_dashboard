-- =============================================
-- Target OS — Multi-utilisateurs (Admin / Prospecteur)
-- À exécuter dans Supabase → SQL Editor → Run
-- Prérequis : table public.prospects existante
-- =============================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Table profiles (liée à auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'prospecteur'
    CHECK (role IN ('admin', 'prospecteur')),
  prenom TEXT,
  nom TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

COMMENT ON TABLE public.profiles IS 'Profils applicatifs Target OS — rôles admin ou prospecteur';
COMMENT ON COLUMN public.profiles.role IS 'admin : accès global | prospecteur : prospects assignés uniquement';

-- ---------------------------------------------------------------------------
-- 2. Colonne assigned_to sur prospects
-- ---------------------------------------------------------------------------

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON public.prospects (assigned_to);

COMMENT ON COLUMN public.prospects.assigned_to IS 'Prospecteur assigné — NULL = lead orphelin (généré par n8n, en attente d''assignation admin)';

-- ---------------------------------------------------------------------------
-- 3. Fonctions utilitaires RLS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_prospecteur()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'prospecteur'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger : création automatique du profil à l'inscription
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, prenom, nom)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'prospecteur'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'prenom'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nom'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    prenom = COALESCE(EXCLUDED.prenom, public.profiles.prenom),
    nom = COALESCE(EXCLUDED.nom, public.profiles.nom);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. RLS — profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;

-- Lecture : son propre profil OU admin voit tout
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Mise à jour : soi-même (sans changer role) OU admin (tout)
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- Seuls les admins peuvent créer / supprimer des profils manuellement
CREATE POLICY "profiles_admin_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. RLS — prospects (remplace les policies ouvertes)
-- ---------------------------------------------------------------------------

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique prospects" ON public.prospects;
DROP POLICY IF EXISTS "Insertion prospects" ON public.prospects;
DROP POLICY IF EXISTS "Mise a jour prospects" ON public.prospects;
DROP POLICY IF EXISTS "Suppression prospects" ON public.prospects;

-- SELECT — Admin : tout
CREATE POLICY "prospects_select_admin"
  ON public.prospects
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- SELECT — Prospecteur : uniquement ses assignations
CREATE POLICY "prospects_select_prospecteur"
  ON public.prospects
  FOR SELECT
  TO authenticated
  USING (
    public.is_prospecteur()
    AND assigned_to = auth.uid()
  );

-- SELECT — Public (anon) : lecture par slug pour /audit/[slug]
-- Permet de récupérer le prospect via son slug sans authentification
CREATE POLICY "prospects_select_public_by_slug"
  ON public.prospects
  FOR SELECT
  TO anon
  USING (slug IS NOT NULL);

-- INSERT — Admin uniquement (côté app)
CREATE POLICY "prospects_insert_admin"
  ON public.prospects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- INSERT — n8n / webhooks anon : leads orphelins sans assignation
-- ⚠️ En production, préférer SUPABASE_SERVICE_ROLE_KEY dans n8n (bypass RLS)
CREATE POLICY "prospects_insert_n8n_orphan"
  ON public.prospects
  FOR INSERT
  TO anon
  WITH CHECK (assigned_to IS NULL);

-- UPDATE — Admin : tout
CREATE POLICY "prospects_update_admin"
  ON public.prospects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- UPDATE — Prospecteur : uniquement ses assignations (statut, notes, slug, etc.)
CREATE POLICY "prospects_update_prospecteur"
  ON public.prospects
  FOR UPDATE
  TO authenticated
  USING (
    public.is_prospecteur()
    AND assigned_to = auth.uid()
  )
  WITH CHECK (
    public.is_prospecteur()
    AND assigned_to = auth.uid()
  );

-- UPDATE — n8n anon : enrichissement des orphelins (html_rapport, slug, scores…)
CREATE POLICY "prospects_update_n8n_orphan"
  ON public.prospects
  FOR UPDATE
  TO anon
  USING (assigned_to IS NULL)
  WITH CHECK (assigned_to IS NULL);

-- DELETE — Admin uniquement
CREATE POLICY "prospects_delete_admin"
  ON public.prospects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;

-- ---------------------------------------------------------------------------
-- 7. Post-migration : promouvoir le premier administrateur
-- ---------------------------------------------------------------------------
-- Remplace l'email ci-dessous, puis exécute cette requête séparément
-- après avoir créé le compte via Supabase Auth (Dashboard ou /login).

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@target-os.com';

-- ---------------------------------------------------------------------------
-- 8. Vérifications
-- ---------------------------------------------------------------------------

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'prospects')
ORDER BY table_name, ordinal_position;

SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'prospects')
ORDER BY tablename, policyname;
