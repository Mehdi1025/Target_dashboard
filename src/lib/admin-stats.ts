import { computeDashboardStats, type DashboardStats } from "@/lib/dashboard-stats";
import type { ProfileRow, ProspectListItem } from "@/types/database.types";
import { getProfileDisplayName } from "@/lib/profile-utils";

export type ProspecteurManagementRow = {
  profile: ProfileRow;
  stats: DashboardStats;
  tauxApprobation: number;
};

export type AdminOverview = {
  totalProspects: number;
  totalProspecteurs: number;
  orphanCount: number;
  globalConversion: number;
  aValiderGlobal: number;
  approuvesGlobal: number;
  prospecteurRows: ProspecteurManagementRow[];
};

export type AdminFunnelStep = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type AdminStatistics = {
  funnel: AdminFunnelStep[];
  scoreMoyen: number | null;
  topScore: number | null;
  leadsChauds: number;
  leadsFroids: number;
  avecLienClient: number;
  avecNotes: number;
  tauxAssignation: number;
  ajoutesSemaine: number;
  ajoutesMois: number;
  chargeMoyenne: number;
  repartitionStatuts: { label: string; count: number; pct: number }[];
  prospecteurRanking: {
    id: string;
    name: string;
    total: number;
    approuves: number;
    conversion: number;
    scoreMoyen: number | null;
  }[];
  topProspects: {
    id: string;
    entreprise: string;
    score: number;
    statut: string;
  }[];
};

function isWithinDays(iso: string, days: number): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export function computeAdminStatistics(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[],
  orphanCount: number,
  overview: AdminOverview
): AdminStatistics {
  const assigned = prospects.filter((p) => p.assigned_to !== null);
  const totalLeads = prospects.length;
  const tauxAssignation =
    totalLeads > 0 ? Math.round((assigned.length / totalLeads) * 100) : 0;

  const scores = assigned
    .map((p) => p.ia_score)
    .filter((s): s is number => s !== null);

  const statutMap = new Map<string, number>();
  for (const prospect of assigned) {
    const key = prospect.statut.trim() || "Non défini";
    statutMap.set(key, (statutMap.get(key) ?? 0) + 1);
  }

  const totalAssigned = assigned.length || 1;
  const repartitionStatuts = Array.from(statutMap.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / totalAssigned) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const prospecteurRanking = overview.prospecteurRows
    .map((row) => ({
      id: row.profile.id,
      name: getProfileDisplayName(row.profile),
      total: row.stats.total,
      approuves: row.stats.approuves,
      conversion: row.tauxApprobation,
      scoreMoyen: row.stats.scoreMoyen,
    }))
    .sort((a, b) => b.conversion - a.conversion || b.total - a.total);

  const topProspects = assigned
    .filter((p): p is ProspectListItem & { ia_score: number } => p.ia_score !== null)
    .sort((a, b) => b.ia_score - a.ia_score)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      entreprise: p.entreprise,
      score: p.ia_score,
      statut: p.statut,
    }));

  const funnel: AdminFunnelStep[] = [
    {
      key: "orphans",
      label: "Orphelins n8n",
      value: orphanCount,
      color: "bg-amber-500",
    },
    {
      key: "assigned",
      label: "Assignés",
      value: assigned.length,
      color: "bg-sky-500",
    },
    {
      key: "avalider",
      label: "À valider",
      value: overview.aValiderGlobal,
      color: "bg-orange-500",
    },
    {
      key: "approuves",
      label: "Approuvés",
      value: overview.approuvesGlobal,
      color: "bg-emerald-500",
    },
  ];

  return {
    funnel,
    scoreMoyen:
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : null,
    topScore: scores.length > 0 ? Math.max(...scores) : null,
    leadsChauds: assigned.filter((p) => p.ia_score !== null && p.ia_score >= 75).length,
    leadsFroids: assigned.filter((p) => p.ia_score !== null && p.ia_score < 50).length,
    avecLienClient: assigned.filter((p) => Boolean(p.slug)).length,
    avecNotes: assigned.filter((p) => Boolean(p.notes?.trim())).length,
    tauxAssignation,
    ajoutesSemaine: prospects.filter((p) => isWithinDays(p.created_at, 7)).length,
    ajoutesMois: prospects.filter((p) => isWithinDays(p.created_at, 30)).length,
    chargeMoyenne:
      prospecteurs.length > 0 ? Math.round(assigned.length / prospecteurs.length) : 0,
    repartitionStatuts,
    prospecteurRanking,
    topProspects,
  };
}

export function computeAdminOverview(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[],
  orphanCount: number
): AdminOverview {
  const assignedProspects = prospects.filter((p) => p.assigned_to !== null);
  const globalStats = computeDashboardStats(assignedProspects);
  const globalConversion =
    globalStats.total > 0
      ? Math.round((globalStats.approuves / globalStats.total) * 100)
      : 0;

  const prospecteurRows: ProspecteurManagementRow[] = prospecteurs.map((profile) => {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const stats = computeDashboardStats(assigned);
    const tauxApprobation =
      stats.total > 0 ? Math.round((stats.approuves / stats.total) * 100) : 0;

    return { profile, stats, tauxApprobation };
  });

  return {
    totalProspects: globalStats.total,
    totalProspecteurs: prospecteurs.length,
    orphanCount,
    globalConversion,
    aValiderGlobal: globalStats.aValider,
    approuvesGlobal: globalStats.approuves,
    prospecteurRows,
  };
}
