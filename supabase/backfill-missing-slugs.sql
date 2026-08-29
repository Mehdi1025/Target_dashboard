-- Remplit uniquement les slugs manquants (sans toucher aux existants)
-- Supabase → SQL Editor → Run

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
      'prospect'
    ) AS base_slug,
    created_at
  FROM public.prospects
  WHERE slug IS NULL AND entreprise IS NOT NULL
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
      WHEN EXISTS (
        SELECT 1 FROM public.prospects existing
        WHERE existing.slug = p.candidate_slug
          AND existing.id <> p.id
      )
      THEN p.candidate_slug || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
      ELSE p.candidate_slug
    END AS new_slug
  FROM proposed p
)
UPDATE public.prospects pr
SET slug = f.new_slug
FROM final f
WHERE pr.id = f.id;

SELECT entreprise, slug FROM public.prospects WHERE slug IS NULL;
