-- Corrige le backfill : les 51 derniers leads = France, le reste = Suisse
-- Supabase → SQL Editor → Run

-- 1) Les 51 plus récents → France
UPDATE public.prospects
SET pays = 'FR'
WHERE id IN (
  SELECT id
  FROM public.prospects
  ORDER BY created_at DESC
  LIMIT 51
);

-- 2) Tous les autres → Suisse (sauf si vous avez d'autres cas particuliers)
UPDATE public.prospects
SET pays = 'CH'
WHERE id NOT IN (
  SELECT id
  FROM public.prospects
  ORDER BY created_at DESC
  LIMIT 51
);

-- Vérification
SELECT pays, COUNT(*) AS total
FROM public.prospects
GROUP BY pays
ORDER BY pays;

-- Détail des 51 leads FR (doit afficher 51 lignes)
SELECT id, entreprise, email, pays, created_at
FROM public.prospects
WHERE pays = 'FR'
ORDER BY created_at DESC;
