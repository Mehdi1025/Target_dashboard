import type { ProspectListItem } from "@/types/prospect";

export type DashboardStats = {
  total: number;
  aValider: number;
  approuves: number;
  scoreMoyen: number | null;
  topScore: number | null;
};

export type ProspectorStats = DashboardStats & {
  /** Nom affiché en attendant les profils multi-utilisateurs */
  prospectorName: string;
  leadsChauds: number;
  leadsFroids: number;
  avecLienClient: number;
  avecNotes: number;
  tauxApprobation: number;
  ajoutesSemaine: number;
  ajoutesMois: number;
  repartitionStatuts: { label: string; count: number; pct: number }[];
  topProspects: { id: string; entreprise: string; score: number; statut: string }[];
};

const DEFAULT_PROSPECTOR_NAME = "Prospecteur";

export function computeDashboardStats(prospects: ProspectListItem[]): DashboardStats {
  const aValider = prospects.filter((p) =>
    p.statut.toLowerCase().includes("valider")
  ).length;

  const approuves = prospects.filter((p) => {
    const s = p.statut.toLowerCase();
    return s.includes("approuv") || s.includes("envoy");
  }).length;

  const scores = prospects
    .map((p) => p.ia_score)
    .filter((score): score is number => score !== null);

  const scoreMoyen =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;

  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  return {
    total: prospects.length,
    aValider,
    approuves,
    scoreMoyen,
    topScore,
  };
}

function isWithinDays(iso: string, days: number): boolean {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export function computeProspectorStats(
  prospects: ProspectListItem[],
  prospectorName = DEFAULT_PROSPECTOR_NAME
): ProspectorStats {
  const base = computeDashboardStats(prospects);
  const total = base.total || 1;

  const leadsChauds = prospects.filter((p) => p.ia_score !== null && p.ia_score >= 75).length;
  const leadsFroids = prospects.filter((p) => p.ia_score !== null && p.ia_score < 50).length;
  const avecLienClient = prospects.filter((p) => Boolean(p.slug)).length;
  const avecNotes = prospects.filter((p) => Boolean(p.notes?.trim())).length;

  const statutMap = new Map<string, number>();
  for (const prospect of prospects) {
    const key = prospect.statut.trim() || "Non défini";
    statutMap.set(key, (statutMap.get(key) ?? 0) + 1);
  }

  const repartitionStatuts = Array.from(statutMap.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const topProspects = prospects
    .filter((p): p is ProspectListItem & { ia_score: number } => p.ia_score !== null)
    .sort((a, b) => b.ia_score - a.ia_score)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      entreprise: p.entreprise,
      score: p.ia_score,
      statut: p.statut,
    }));

  return {
    ...base,
    prospectorName,
    leadsChauds,
    leadsFroids,
    avecLienClient,
    avecNotes,
    tauxApprobation: Math.round((base.approuves / total) * 100),
    ajoutesSemaine: prospects.filter((p) => isWithinDays(p.created_at, 7)).length,
    ajoutesMois: prospects.filter((p) => isWithinDays(p.created_at, 30)).length,
    repartitionStatuts,
    topProspects,
  };
}
