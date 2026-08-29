import type { ProspectDetailCore } from "@/types/prospect";

export type ProspectPipelineContext = {
  totalProspects: number;
  scoreMoyen: number | null;
  rank: number | null;
  topScore: number | null;
};

export type ProspectStats = {
  score: number | null;
  scoreDelta: number | null;
  rank: number | null;
  totalProspects: number;
  percentile: number | null;
  completeness: number;
  forcesCount: number;
  faiblessesCount: number;
  analyseWords: number;
  daysInPipeline: number;
  readiness: {
    slug: boolean;
    scriptEmail: boolean;
    auditComplete: boolean;
    notes: boolean;
    proposition: boolean;
  };
  readinessScore: number;
};

const TRACKED_FIELDS: (keyof ProspectDetailCore)[] = [
  "prenom",
  "nom",
  "email",
  "poste",
  "entreprise",
  "url",
  "secteur",
  "taille_entreprise",
  "chiffre_affaires",
  "annee_creation",
  "ia_score",
  "analyse_site",
  "forces",
  "faiblesses",
  "proposition_commerciale",
  "script_email",
  "slug",
  "notes",
];

function countListItems(text: string | null): number {
  if (!text?.trim()) return 0;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) =>
    /^[-•*–—]\s|^\d+[.)]\s|^✓|^✗|^→/.test(line)
  );

  return bulletLines.length > 0 ? bulletLines.length : Math.min(lines.length, 1);
}

function countWords(text: string | null): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function daysSince(iso: string): number {
  const created = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function computeProspectStats(
  prospect: ProspectDetailCore,
  pipeline: ProspectPipelineContext
): ProspectStats {
  const filled = TRACKED_FIELDS.filter((field) => {
    const value = prospect[field];
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }).length;

  const completeness = Math.round((filled / TRACKED_FIELDS.length) * 100);

  const readiness = {
    slug: Boolean(prospect.slug),
    scriptEmail: Boolean(prospect.script_email?.trim()),
    auditComplete: Boolean(
      prospect.analyse_site?.trim() &&
        prospect.forces?.trim() &&
        prospect.faiblesses?.trim()
    ),
    notes: Boolean(prospect.notes?.trim()),
    proposition: Boolean(prospect.proposition_commerciale?.trim()),
  };

  const readinessChecks = Object.values(readiness);
  const readinessScore = Math.round(
    (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
  );

  const score = prospect.ia_score;
  const scoreDelta =
    score !== null && pipeline.scoreMoyen !== null
      ? score - pipeline.scoreMoyen
      : null;

  const percentile =
    score !== null && pipeline.rank !== null && pipeline.totalProspects > 0
      ? Math.round(
          ((pipeline.totalProspects - pipeline.rank + 1) / pipeline.totalProspects) * 100
        )
      : null;

  return {
    score,
    scoreDelta,
    rank: pipeline.rank,
    totalProspects: pipeline.totalProspects,
    percentile,
    completeness,
    forcesCount: countListItems(prospect.forces),
    faiblessesCount: countListItems(prospect.faiblesses),
    analyseWords: countWords(prospect.analyse_site),
    daysInPipeline: daysSince(prospect.created_at),
    readiness,
    readinessScore,
  };
}

export async function getProspectPipelineContext(
  supabase: ReturnType<typeof import("@/lib/supabase").createSupabaseClient>,
  prospectId: string
): Promise<ProspectPipelineContext> {
  const { data } = await supabase
    .from("prospects")
    .select("id, ia_score")
    .order("ia_score", { ascending: false, nullsFirst: false });

  const prospects = data ?? [];
  const totalProspects = prospects.length;

  const scores = prospects
    .map((p) => p.ia_score)
    .filter((s): s is number => s !== null);

  const scoreMoyen =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null;

  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  const current = prospects.find((p) => p.id === prospectId);
  let rank: number | null = null;

  if (current?.ia_score !== null && current?.ia_score !== undefined) {
    rank = prospects.findIndex((p) => p.id === prospectId) + 1;
    if (rank === 0) rank = null;
  }

  return { totalProspects, scoreMoyen, rank, topScore };
}
