import { differenceInHours, endOfWeek, startOfWeek } from "date-fns";

import { WEEKLY_RDV_TARGET } from "@/lib/bounty-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import type {
  OrphanProspectItem,
  ProfileRow,
  ProspectListItem,
} from "@/types/database.types";

export type ControlAlertSeverity = "critical" | "warning" | "info";

export type ControlAlert = {
  id: string;
  severity: ControlAlertSeverity;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  count: number;
};

export type ControlTowerStats = {
  alerts: ControlAlert[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    status: "operational" | "degraded" | "critical";
    statusLabel: string;
    headline: string;
  };
};

function isCurrentWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return date >= startOfWeek(now, { weekStartsOn: 1 }) && date <= endOfWeek(now, { weekStartsOn: 1 });
}

function countValidatedThisWeek(prospects: ProspectListItem[]): number {
  return prospects.filter(
    (p) =>
      p.rdv_status === "VALIDATED" &&
      p.rdv_date !== null &&
      isCurrentWeek(p.rdv_date)
  ).length;
}

function severityRank(severity: ControlAlertSeverity): number {
  return { critical: 0, warning: 1, info: 2 }[severity];
}

export function computeControlTower(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[],
  orphans: OrphanProspectItem[],
  lastActivityByProfileId: Record<string, string>
): ControlTowerStats {
  const alerts: ControlAlert[] = [];
  const now = new Date();

  const pendingRdvs = prospects.filter((p) => p.rdv_status === "PENDING");
  const staleRdvs = pendingRdvs.filter((p) => {
    if (!p.rdv_date) return false;
    return differenceInHours(now, new Date(p.rdv_date)) >= 24;
  });

  if (staleRdvs.length > 0) {
    const names = staleRdvs
      .slice(0, 3)
      .map((p) => p.entreprise)
      .join(", ");
    alerts.push({
      id: "rdv-stale",
      severity: "critical",
      title: `${staleRdvs.length} RDV en attente > 24h`,
      message: `Validation admin urgente — ${names}${staleRdvs.length > 3 ? "…" : ""}.`,
      actionLabel: "Ouvrir le Purgatoire",
      actionHref: "/admin#purgatoire",
      count: staleRdvs.length,
    });
  } else if (pendingRdvs.length > 0) {
    alerts.push({
      id: "rdv-pending",
      severity: "warning",
      title: `${pendingRdvs.length} RDV en attente de validation`,
      message: "Le Purgatoire contient des RDV récents à traiter.",
      actionLabel: "Valider les RDV",
      actionHref: "/admin#purgatoire",
      count: pendingRdvs.length,
    });
  }

  if (orphans.length > 0) {
    const hotOrphans = orphans.filter((o) => o.ia_score !== null && o.ia_score >= 75);
    alerts.push({
      id: "orphans",
      severity: orphans.length >= 5 ? "critical" : "warning",
      title: `${orphans.length} lead${orphans.length > 1 ? "s" : ""} orphelin${orphans.length > 1 ? "s" : ""}`,
      message:
        hotOrphans.length > 0
          ? `${hotOrphans.length} lead${hotOrphans.length > 1 ? "s" : ""} chaud${hotOrphans.length > 1 ? "s" : ""} (≥75) sans prospecteur assigné.`
          : "Assignez les entrées n8n pour alimenter le pipeline.",
      actionLabel: "Distribuer les orphelins",
      actionHref: "/admin#orphelins",
      count: orphans.length,
    });
  }

  for (const profile of prospecteurs) {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const validatedWeek = countValidatedThisWeek(assigned);
    const name = getProfileDisplayName(profile);
    const remaining = WEEKLY_RDV_TARGET - validatedWeek;

    if (validatedWeek < WEEKLY_RDV_TARGET && remaining <= 5 && remaining > 0) {
      alerts.push({
        id: `quota-${profile.id}`,
        severity: remaining >= 4 ? "warning" : "critical",
        title: `${name} — ${validatedWeek}/${WEEKLY_RDV_TARGET} RDV`,
        message: `Risque bonus volume — ${remaining} RDV restant${remaining > 1 ? "s" : ""} cette semaine.`,
        actionLabel: "Voir la fiche",
        actionHref: `/admin/prospecteurs/${profile.id}`,
        count: remaining,
      });
    }

    const lastActivity = lastActivityByProfileId[profile.id];
    if (!lastActivity) {
      alerts.push({
        id: `inactive-${profile.id}`,
        severity: "warning",
        title: `${name} — aucune activité ECG`,
        message: "Aucune micro-action tracée récemment sur le CRM.",
        actionLabel: "Voir la fiche",
        actionHref: `/admin/prospecteurs/${profile.id}`,
        count: 0,
      });
    } else if (differenceInHours(now, new Date(lastActivity)) >= 48) {
      alerts.push({
        id: `inactive-${profile.id}`,
        severity: "info",
        title: `${name} — inactif 48h+`,
        message: "Pas d'activité ECG depuis plus de 2 jours.",
        actionLabel: "Voir la fiche",
        actionHref: `/admin/prospecteurs/${profile.id}`,
        count: 0,
      });
    }
  }

  const rejectedCount = prospects.filter((p) => p.rdv_status === "REJECTED").length;
  if (rejectedCount >= 3) {
    alerts.push({
      id: "rdv-rejected",
      severity: "info",
      title: `${rejectedCount} RDV rejetés`,
      message: "Renforcez les briefings prospecteurs pour réduire les rejets qualité.",
      actionLabel: "Voir statistiques",
      actionHref: "/admin/statistiques",
      count: rejectedCount,
    });
  }

  alerts.sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity) || b.count - a.count
  );

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  let status: ControlTowerStats["summary"]["status"] = "operational";
  let statusLabel = "Système opérationnel";
  let headline = "Aucune alerte critique — l'équipe est sous contrôle.";

  if (criticalCount > 0) {
    status = "critical";
    statusLabel = "Intervention requise";
    headline = `${criticalCount} alerte${criticalCount > 1 ? "s" : ""} critique${criticalCount > 1 ? "s" : ""} — action immédiate recommandée.`;
  } else if (warningCount > 0) {
    status = "degraded";
    statusLabel = "Surveillance active";
    headline = `${warningCount} point${warningCount > 1 ? "s" : ""} d'attention — traitez les actions ci-dessous.`;
  } else if (infoCount > 0) {
    headline = `${infoCount} signal${infoCount > 1 ? "s" : ""} informatif${infoCount > 1 ? "s" : ""} — rien d'urgent.`;
  }

  return {
    alerts,
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      status,
      statusLabel,
      headline,
    },
  };
}
