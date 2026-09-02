import type { AdminOverview } from "@/lib/admin-stats";
import type { ProspectListItem } from "@/types/database.types";

export type PipelineFlowStep = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
  glowColor: string;
  pctOfTotal: number;
  dropFromPrev: number | null;
};

export type PipelineBottleneck = {
  stepKey: string;
  label: string;
  count: number;
  message: string;
  severity: "critical" | "warning" | "info";
};

export type RdvPipelineBreakdown = {
  none: number;
  pending: number;
  validated: number;
  rejected: number;
  declared: number;
  validationRate: number;
  rejectionRate: number;
};

export type PipelineFlowStats = {
  steps: PipelineFlowStep[];
  totalIngested: number;
  assignedCount: number;
  orphanCount: number;
  convertedCount: number;
  overallConversionPct: number;
  assignToConvertPct: number;
  bottlenecks: PipelineBottleneck[];
  rdv: RdvPipelineBreakdown;
  insight: string;
};

const STEP_DEFS = [
  {
    key: "ingested",
    label: "Entrées n8n",
    shortLabel: "n8n",
    color: "from-slate-500 to-slate-600",
    glowColor: "rgba(100,116,139,0.45)",
  },
  {
    key: "assigned",
    label: "Assignés",
    shortLabel: "Assignés",
    color: "from-sky-500 to-blue-600",
    glowColor: "rgba(14,165,233,0.45)",
  },
  {
    key: "approuves",
    label: "Approuvés",
    shortLabel: "Approuvés",
    color: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16,185,129,0.45)",
  },
  {
    key: "rdv_declared",
    label: "RDV déclarés",
    shortLabel: "RDV décl.",
    color: "from-orange-500 to-amber-600",
    glowColor: "rgba(249,115,22,0.45)",
  },
  {
    key: "rdv_validated",
    label: "RDV validés",
    shortLabel: "RDV valid.",
    color: "from-violet-500 to-purple-600",
    glowColor: "rgba(139,92,246,0.45)",
  },
  {
    key: "converted",
    label: "Convertis",
    shortLabel: "Convertis",
    color: "from-amber-500 to-yellow-500",
    glowColor: "rgba(245,158,11,0.5)",
  },
] as const;

function isApprouve(statut: string): boolean {
  const s = statut.toLowerCase();
  return s.includes("approuv") || s.includes("envoy");
}

function isConverted(prospect: ProspectListItem): boolean {
  return (
    prospect.statut.toLowerCase().includes("converti") ||
    Number(prospect.deal_amount ?? 0) > 0
  );
}

function buildInsight(
  bottlenecks: PipelineBottleneck[],
  orphanCount: number,
  rdv: RdvPipelineBreakdown,
  overallConversionPct: number
): string {
  if (bottlenecks.length > 0 && bottlenecks[0].severity === "critical") {
    return bottlenecks[0].message;
  }
  if (orphanCount > 0) {
    return `${orphanCount} lead${orphanCount > 1 ? "s" : ""} orphelin${orphanCount > 1 ? "s" : ""} en attente d'assignation — goulet amont du flux.`;
  }
  if (rdv.pending > 0) {
    return `${rdv.pending} RDV en attente de validation admin — accélérez le Purgatoire pour débloquer les quotas.`;
  }
  if (overallConversionPct >= 10) {
    return `Conversion globale solide à ${overallConversionPct}% — le pipeline convertit efficacement.`;
  }
  return "Pipeline fluide — surveillez les étapes RDV pour maximiser les conversions.";
}

export function computePipelineFlow(
  prospects: ProspectListItem[],
  orphanCount: number,
  overview: AdminOverview
): PipelineFlowStats {
  const assigned = prospects.filter((p) => p.assigned_to !== null);
  const totalIngested = prospects.length;

  const approuves = assigned.filter((p) => isApprouve(p.statut)).length;
  const rdvPending = assigned.filter((p) => p.rdv_status === "PENDING").length;
  const rdvValidated = assigned.filter((p) => p.rdv_status === "VALIDATED").length;
  const rdvRejected = assigned.filter((p) => p.rdv_status === "REJECTED").length;
  const rdvNone = assigned.filter((p) => (p.rdv_status ?? "NONE") === "NONE").length;
  const rdvDeclared = assigned.filter(
    (p) => (p.rdv_status ?? "NONE") !== "NONE"
  ).length;
  const convertedCount = assigned.filter(isConverted).length;

  const rdvReviewed = rdvValidated + rdvRejected;
  const validationRate =
    rdvReviewed > 0 ? Math.round((rdvValidated / rdvReviewed) * 100) : 0;
  const rejectionRate =
    rdvReviewed > 0 ? Math.round((rdvRejected / rdvReviewed) * 100) : 0;

  const rawValues: Record<string, number> = {
    ingested: totalIngested,
    assigned: assigned.length,
    approuves,
    rdv_declared: rdvDeclared,
    rdv_validated: rdvValidated,
    converted: convertedCount,
  };

  const steps: PipelineFlowStep[] = STEP_DEFS.map((def, index) => {
    const value = rawValues[def.key] ?? 0;
    const prevValue = index > 0 ? rawValues[STEP_DEFS[index - 1].key] ?? 0 : null;
    const dropFromPrev =
      prevValue !== null && prevValue > 0
        ? Math.round(((prevValue - value) / prevValue) * 100)
        : null;

    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      value,
      color: def.color,
      glowColor: def.glowColor,
      pctOfTotal:
        totalIngested > 0 ? Math.round((value / totalIngested) * 100) : 0,
      dropFromPrev,
    };
  });

  const overallConversionPct =
    totalIngested > 0 ? Math.round((convertedCount / totalIngested) * 100) : 0;
  const assignToConvertPct =
    assigned.length > 0 ? Math.round((convertedCount / assigned.length) * 100) : 0;

  const bottlenecks: PipelineBottleneck[] = [];

  if (orphanCount >= 3) {
    bottlenecks.push({
      stepKey: "orphans",
      label: "Orphelins n8n",
      count: orphanCount,
      message: `${orphanCount} orphelins bloqués — assignez-les pour alimenter le pipeline.`,
      severity: orphanCount >= 8 ? "critical" : "warning",
    });
  }

  if (overview.aValiderGlobal >= 5) {
    bottlenecks.push({
      stepKey: "avalider",
      label: "À valider",
      count: overview.aValiderGlobal,
      message: `${overview.aValiderGlobal} leads à valider côté prospecteurs — goulet sur l'approbation.`,
      severity: overview.aValiderGlobal >= 15 ? "critical" : "warning",
    });
  }

  if (rdvPending >= 2) {
    bottlenecks.push({
      stepKey: "rdv_pending",
      label: "RDV en attente",
      count: rdvPending,
      message: `${rdvPending} RDV dans le Purgatoire — validation admin requise.`,
      severity: rdvPending >= 5 ? "critical" : "warning",
    });
  }

  if (rdvRejected >= 2) {
    bottlenecks.push({
      stepKey: "rdv_rejected",
      label: "RDV rejetés",
      count: rdvRejected,
      message: `${rdvRejected} RDV rejetés — renforcez les briefings prospecteurs.`,
      severity: "info",
    });
  }

  const assignedButNotApproved = assigned.filter((p) => !isApprouve(p.statut)).length;
  if (assignedButNotApproved >= 10 && approuves < assigned.length * 0.3) {
    bottlenecks.push({
      stepKey: "assigned",
      label: "Assignés non approuvés",
      count: assignedButNotApproved,
      message: `Peu d'approbations (${approuves}/${assigned.length}) — le flux ralentit après assignation.`,
      severity: "info",
    });
  }

  bottlenecks.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count;
  });

  const rdv: RdvPipelineBreakdown = {
    none: rdvNone,
    pending: rdvPending,
    validated: rdvValidated,
    rejected: rdvRejected,
    declared: rdvDeclared,
    validationRate,
    rejectionRate,
  };

  return {
    steps,
    totalIngested,
    assignedCount: assigned.length,
    orphanCount,
    convertedCount,
    overallConversionPct,
    assignToConvertPct,
    bottlenecks,
    rdv,
    insight: buildInsight(bottlenecks, orphanCount, rdv, overallConversionPct),
  };
}
