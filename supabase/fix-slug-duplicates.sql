-- Fix doublons slug (à lancer si migration-slug.sql a échoué)
-- Supabase → SQL Editor → Run

DROP INDEX IF EXISTS idx_prospects_slug_unique;

-- Regénère tous les slugs proprement
WITH candidates AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        lower(
          regexp_replace(
            regexp_replace(trim(entreprise), '[^a-zA-Z0-9]+', '-', 'g'),
            '(^-|-$)', '', 'g'
          )
        ),
        ''
      ),
      'entreprise'
    ) AS base_slug,
    created_at
  FROM public.prospects
  WHERE entreprise IS NOT NULL
),
numbered AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY base_slug
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM candidates
),
proposed AS (
  SELECT
    id,
    CASE
      WHEN rn = 1 THEN base_slug
      ELSE base_slug || '-' || rn
    END AS candidate_slug
  FROM numbered
),
final AS (
  SELECT
    p.id,
    CASE
      WHEN COUNT(*) OVER (PARTITION BY p.candidate_slug) > 1
        THEN p.candidate_slug || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
      ELSE p.candidate_slug
    END AS new_slug
  FROM proposed p
)
UPDATE public.prospects pr
SET slug = f.new_slug
FROM final f
WHERE pr.id = f.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_slug_unique
  ON public.prospects (slug)
  WHERE slug IS NOT NULL;

SELECT entreprise, slug FROM public.prospects ORDER BY slug;
