-- =============================================
-- Target OS — RESET COMPLET table prospects
-- ⚠️  SUPPRIME TOUTES LES DONNÉES
-- Où coller : Supabase → SQL Editor → Run
-- =============================================

-- 1. Supprimer l'ancienne table (données + policies incluses)
DROP TABLE IF EXISTS public.prospects CASCADE;

-- 2. Recréer la table propre (schéma définitif)
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug TEXT UNIQUE,

  -- Identité
  prenom TEXT,
  nom TEXT,
  email TEXT NOT NULL,
  poste TEXT,

  -- Entreprise
  entreprise TEXT NOT NULL,
  url TEXT,
  secteur TEXT,
  taille_entreprise TEXT,
  chiffre_affaires TEXT,
  annee_creation TEXT,

  -- IA & Audit
  ia_score INTEGER,
  analyse_site TEXT,
  forces TEXT,
  faiblesses TEXT,
  proposition_commerciale TEXT,
  script_email TEXT,
  html_rapport TEXT,

  -- Suivi
  statut TEXT NOT NULL DEFAULT 'À valider',
  notes TEXT
);

-- 3. Index utiles
CREATE INDEX idx_prospects_statut ON public.prospects (statut);
CREATE INDEX idx_prospects_ia_score ON public.prospects (ia_score DESC NULLS LAST);
CREATE INDEX idx_prospects_entreprise ON public.prospects (entreprise);

-- 4. Row Level Security (dashboard + n8n)
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique prospects"
  ON public.prospects
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Insertion prospects"
  ON public.prospects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Mise a jour prospects"
  ON public.prospects
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Suppression prospects"
  ON public.prospects
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 5. Données de démo (optionnel — commente si tu n'en veux pas)
INSERT INTO public.prospects (
  prenom, nom, email, poste,
  entreprise, url, secteur, taille_entreprise, chiffre_affaires, annee_creation,
  ia_score, analyse_site, forces, faiblesses, proposition_commerciale, script_email,
  statut
) VALUES
(
  'Marie', 'Dupont', 'marie.dupont@technova.fr', 'Directrice Marketing',
  'TechNova SAS', 'https://technova.fr', 'SaaS B2B', '50-100 employés', '5-10 M€', '2018',
  87,
  'Site moderne, proposition de valeur claire, blog actif mais peu de preuves sociales.',
  'Positionnement niche, contenu SEO de qualité, équipe technique solide.',
  'Peu de témoignages clients, CTA faibles sur la page pricing.',
  'Accompagnement sur l''automatisation de la prospection outbound avec scoring IA.',
  E'Bonjour Marie,\n\nJ''ai analysé le site de TechNova et votre approche SaaS B2B est très pertinente.\n\nNous aidons des équipes marketing comme la vôtre à automatiser la prospection tout en gardant un message personnalisé.\n\nSeriez-vous disponible 15 min cette semaine ?\n\nBien cordialement,',
  'À valider'
),
(
  'Jean', 'Martin', 'j.martin@dataflow.io', 'CEO',
  'DataFlow Inc', 'https://dataflow.io', 'Data / Analytics', '10-50 employés', '1-5 M€', '2020',
  72,
  'Landing page efficace, message orienté ROI, manque de différenciation visuelle.',
  'Forte expertise data, cas clients PME, pricing transparent.',
  'Peu de contenus thought leadership, funnel de conversion long.',
  'Centralisation des leads + relances automatiques dans un CRM unifié.',
  E'Bonjour Jean,\n\nDataFlow se démarque par sa simplicité d''adoption.\n\nNous pourrions vous aider à accélérer la conversion de vos leads inbound.\n\nPartant pour un échange rapide ?\n\nCordialement,',
  'À valider'
),
(
  'Sophie', 'Bernard', 's.bernard@cloudsync.com', 'VP Sales',
  'CloudSync', 'https://cloudsync.com', 'Cloud Infrastructure', '100-250 employés', '10-25 M€', '2015',
  91,
  'Site corporate mature, présence internationale, documentation technique riche.',
  'Marque établie, pipeline enterprise, équipe sales structurée.',
  'Process de prospection encore manuel, faible personnalisation des approches.',
  'Scoring IA des prospects entrants + scripts email sur-mesure.',
  E'Bonjour Sophie,\n\nCloudSync a une base solide pour scaler la prospection enterprise.\n\nNotre solution de scoring IA pourrait réduire votre temps de qualification de 40%.\n\nUn créneau de 20 min vous conviendrait ?\n\nBien à vous,',
  'Approuvé'
);

-- 6. Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'prospects'
ORDER BY ordinal_position;

SELECT COUNT(*) AS total_prospects FROM public.prospects;
