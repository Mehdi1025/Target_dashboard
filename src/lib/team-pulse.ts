import { differenceInHours, differenceInMinutes, endOfWeek, isWithinInterval, startOfWeek } from "date-fns";

import { WEEKLY_RDV_TARGET, computeBountyStats } from "@/lib/bounty-stats";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import type { ProspectorActivitySnapshot } from "@/lib/get-prospector-activity-snapshot";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { getActionLabel } from "@/types/activity.types";
import type { ProfileRow, ProspectListItem } from "@/types/database.types";

export type TeamPulseStatus = "hunting" | "idle" | "inactive" | "quota_risk";

export type TeamPulseMember = {
  id: string;
  displayName: string;
  email: string;
  status: TeamPulseStatus;
  statusLabel: string;
  lastActivityAt: string | null;
  lastActionType: string | null;
  lastActionLabel: string | null;
  lastEntreprise: string | null;
  rdvValidatedWeek: number;
  rdvWeeklyTarget: number;
  rdvProgressPct: number;
  rdvPending: number;
  rdvRejected: number;
  rdvValidatedTotal: number;
  rdvQualityPct: number | null;
  assignedCount: number;
  aValider: number;
  approuves: number;
  tauxApprobation: number;
  scoreMoyen: number | null;
  volumeBonusUnlocked: boolean;
  createdAt: string;
};

export type TeamPulseSummary = {
  totalMembers: number;
  huntingCount: number;
  inactiveCount: number;
  quotaRiskCount: number;
  avgRdvProgressPct: number;
  teamValidatedWeek: number;
  teamWeeklyTarget: number;
};

export type TeamPulseSnapshot = {
  members: TeamPulseMember[];
  summary: TeamPulseSummary;
};

function isCurrentWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return isWithinInterval(date, { start, end });
}

function countValidatedThisWeek(prospects: ProspectListItem[]): number {
  return prospects.filter(
    (p) =>
      p.rdv_status === "VALIDATED" &&
      p.rdv_date !== null &&
      isCurrentWeek(p.rdv_date)
  ).length;
}

function resolvePulseStatus(
  validatedWeek: number,
  lastActivityAt: string | null,
  now: Date
): { status: TeamPulseStatus; label: string } {
  const remaining = WEEKLY_RDV_TARGET - validatedWeek;
  const day = now.getDay();
  const isLateWeek = day >= 4 || day === 0;
  const isQuotaRisk =
    validatedWeek < WEEKLY_RDV_TARGET &&
    (remaining <= 5 || (isLateWeek && validatedWeek < WEEKLY_RDV_TARGET * 0.55));

  if (isQuotaRisk) {
    return { status: "quota_risk", label: "En retard quota" };
  }

  if (!lastActivityAt) {
    return { status: "inactive", label: "Inactif" };
  }

  const hoursSince = differenceInHours(now, new Date(lastActivityAt));
  if (hoursSince >= 48) {
    return { status: "inactive", label: "Inactif" };
  }

  const minutesSince = differenceInMinutes(now, new Date(lastActivityAt));
  if (minutesSince <= 30) {
    return { status: "hunting", label: "En chasse" };
  }

  return { status: "idle", label: "En veille" };
}

function statusSortRank(status: TeamPulseStatus): number {
  return { hunting: 0, quota_risk: 1, idle: 2, inactive: 3 }[status];
}

export function computeTeamPulse(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[],
  activity: ProspectorActivitySnapshot
): TeamPulseSnapshot {
  const now = new Date();

  const members: TeamPulseMember[] = prospecteurs.map((profile) => {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const stats = computeDashboardStats(assigned);
    const bounty = computeBountyStats(assigned);
    const tauxApprobation =
      stats.total > 0 ? Math.round((stats.approuves / stats.total) * 100) : 0;

    const rdvValidatedTotal = assigned.filter((p) => p.rdv_status === "VALIDATED").length;
    const rdvRejected = assigned.filter((p) => p.rdv_status === "REJECTED").length;
    const rdvQualityDenom = rdvValidatedTotal + rdvRejected;
    const rdvQualityPct =
      rdvQualityDenom > 0
        ? Math.round((rdvValidatedTotal / rdvQualityDenom) * 100)
        : null;

    const lastActivityAt = activity.lastActivityByProfileId[profile.id] ?? null;
    const lastLog = activity.lastLogByProfileId[profile.id];
    const { status, label } = resolvePulseStatus(
      bounty.validatedThisWeek,
      lastActivityAt,
      now
    );

    return {
      id: profile.id,
      displayName: getProfileDisplayName(profile),
      email: profile.email,
      status,
      statusLabel: label,
      lastActivityAt,
      lastActionType: lastLog?.action_type ?? null,
      lastActionLabel: lastLog ? getActionLabel(lastLog.action_type) : null,
      lastEntreprise: lastLog?.metadata?.entreprise ?? null,
      rdvValidatedWeek: bounty.validatedThisWeek,
      rdvWeeklyTarget: WEEKLY_RDV_TARGET,
      rdvProgressPct: bounty.progressPct,
      rdvPending: bounty.pendingCount,
      rdvRejected,
      rdvValidatedTotal,
      rdvQualityPct,
      assignedCount: stats.total,
      aValider: stats.aValider,
      approuves: stats.approuves,
      tauxApprobation,
      scoreMoyen: stats.scoreMoyen,
      volumeBonusUnlocked: bounty.volumeBonusUnlocked,
      createdAt: profile.created_at,
    };
  });

  members.sort((a, b) => {
    const rankDiff = statusSortRank(a.status) - statusSortRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    if (a.lastActivityAt && b.lastActivityAt) {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    }
    return b.rdvValidatedWeek - a.rdvValidatedWeek;
  });

  const teamValidatedWeek = members.reduce((sum, m) => sum + m.rdvValidatedWeek, 0);
  const teamWeeklyTarget = members.length * WEEKLY_RDV_TARGET;

  return {
    members,
    summary: {
      totalMembers: members.length,
      huntingCount: members.filter((m) => m.status === "hunting").length,
      inactiveCount: members.filter((m) => m.status === "inactive").length,
      quotaRiskCount: members.filter((m) => m.status === "quota_risk").length,
      avgRdvProgressPct:
        members.length > 0
          ? Math.round(
              members.reduce((sum, m) => sum + m.rdvProgressPct, 0) / members.length
            )
          : 0,
      teamValidatedWeek,
      teamWeeklyTarget,
    },
  };
}
