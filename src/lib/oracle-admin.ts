import {
  differenceInHours,
  endOfWeek,
  isWithinInterval,
  startOfWeek,
  subWeeks,
} from "date-fns";

import { WEEKLY_RDV_TARGET } from "@/lib/bounty-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import type {
  CallDisposition,
  OrphanProspectItem,
  ProfileRow,
  ProspectListItem,
} from "@/types/database.types";

const DAILY_NRP_COACHING_THRESHOLD = 10;
const REFUS_RATIO_COACHING_THRESHOLD = 0.5;

export type OracleCallDispositionEvent = {
  profileId: string;
  disposition: CallDisposition;
};

export type OracleInsightSeverity = "critical" | "warning" | "opportunity" | "positive";

export type OracleInsight = {
  id: string;
  severity: OracleInsightSeverity;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  priority: number;
};

export type OracleAdminSnapshot = {
  insights: OracleInsight[];
  generatedAt: string;
};

function isCurrentWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

function isPreviousWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const ref = subWeeks(new Date(), 1);
  return isWithinInterval(date, {
    start: startOfWeek(ref, { weekStartsOn: 1 }),
    end: endOfWeek(ref, { weekStartsOn: 1 }),
  });
}

function isConverted(prospect: ProspectListItem): boolean {
  return (
    prospect.statut.toLowerCase().includes("converti") ||
    Number(prospect.deal_amount ?? 0) > 0
  );
}

function rdvDecisionDate(prospect: ProspectListItem): string | null {
  return prospect.rdv_date ?? null;
}

function computeRdvRejectionRate(prospects: ProspectListItem[], week: "current" | "previous"): number | null {
  const inWeek = week === "current" ? isCurrentWeek : isPreviousWeek;
  let validated = 0;
  let rejected = 0;

  for (const prospect of prospects) {
    const date = rdvDecisionDate(prospect);
    if (!date || !inWeek(date)) continue;

    if (prospect.rdv_status === "VALIDATED") validated += 1;
    if (prospect.rdv_status === "REJECTED") rejected += 1;
  }

  const total = validated + rejected;
  if (total === 0) return null;
  return Math.round((rejected / total) * 100);
}

function findBestCloser(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[]
): { id: string; name: string } | null {
  let best: { id: string; name: string; score: number } | null = null;

  for (const profile of prospecteurs) {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    if (assigned.length === 0) continue;

    const converted = assigned.filter(isConverted).length;
    const closingRate = converted / assigned.length;
    const approuves = assigned.filter((p) => {
      const s = p.statut.toLowerCase();
      return s.includes("approuv") || s.includes("envoy");
    }).length;
    const approvalRate = approuves / assigned.length;

    const score = closingRate * 0.6 + approvalRate * 0.4 + converted * 0.05;

    if (!best || score > best.score) {
      best = {
        id: profile.id,
        name: getProfileDisplayName(profile),
        score,
      };
    }
  }

  return best ? { id: best.id, name: best.name } : null;
}

function severityRank(severity: OracleInsightSeverity): number {
  return { critical: 0, warning: 1, opportunity: 2, positive: 3 }[severity];
}

type CallDispositionStats = {
  nrp: number;
  refus: number;
  total: number;
};

function aggregateCallDispositionsByProfile(
  events: OracleCallDispositionEvent[]
): Map<string, CallDispositionStats> {
  const byProfile = new Map<string, CallDispositionStats>();

  for (const event of events) {
    const stats = byProfile.get(event.profileId) ?? { nrp: 0, refus: 0, total: 0 };
    stats.total += 1;
    if (event.disposition === "NRP") stats.nrp += 1;
    if (event.disposition === "REFUS") stats.refus += 1;
    byProfile.set(event.profileId, stats);
  }

  return byProfile;
}

function buildCallCoachingInsights(
  prospecteurs: ProfileRow[],
  events: OracleCallDispositionEvent[]
): OracleInsight[] {
  const byProfile = aggregateCallDispositionsByProfile(events);
  const insights: OracleInsight[] = [];

  for (const profile of prospecteurs) {
    const stats = byProfile.get(profile.id);
    if (!stats || stats.total === 0) continue;

    const refusRatio = stats.refus / stats.total;
    const highNrp = stats.nrp > DAILY_NRP_COACHING_THRESHOLD;
    const highRefusRatio = refusRatio > REFUS_RATIO_COACHING_THRESHOLD;

    if (!highNrp && !highRefusRatio) continue;

    const name = getProfileDisplayName(profile);
    const signals: string[] = [];

    if (highNrp) {
      signals.push(`${stats.nrp} NRP aujourd'hui`);
    }

    if (highRefusRatio) {
      signals.push(
        `${Math.round(refusRatio * 100)}% de refus (${stats.refus}/${stats.total} appels)`
      );
    }

    insights.push({
      id: `call-coaching-${profile.id}`,
      severity: "warning",
      message: `${name} a peut-être besoin d'aide sur son discours téléphonique — ${signals.join(" · ")}.`,
      actionLabel: `Fiche ${name.split(" ")[0] ?? name}`,
      actionHref: `/admin/prospecteurs/${profile.id}`,
      priority: highNrp ? 78 : 74,
    });
  }

  return insights;
}

export function computeOracleAdmin(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[],
  orphans: OrphanProspectItem[],
  todayCallDispositions: OracleCallDispositionEvent[] = []
): OracleAdminSnapshot {
  const now = new Date();
  const insights: OracleInsight[] = [];

  const hotStaleOrphans = orphans.filter(
    (o) =>
      o.ia_score !== null &&
      o.ia_score > 85 &&
      differenceInHours(now, new Date(o.created_at)) >= 48
  );

  if (hotStaleOrphans.length > 0) {
    const closer = findBestCloser(prospecteurs, prospects);
    const assignHint = closer
      ? ` — assignez à ${closer.name} (meilleur taux closing).`
      : " — assignez-les depuis la table orphelins.";
    insights.push({
      id: "hot-orphans-stale",
      severity: "critical",
      message: `${hotStaleOrphans.length} lead${hotStaleOrphans.length > 1 ? "s" : ""} score > 85 orphelin${hotStaleOrphans.length > 1 ? "s" : ""} depuis 48h${assignHint}`,
      actionLabel: closer ? `Fiche ${closer.name}` : "Distribuer",
      actionHref: closer ? `/admin/prospecteurs/${closer.id}` : "/admin#orphelins",
      priority: 100,
    });
  } else if (orphans.filter((o) => o.ia_score !== null && o.ia_score > 85).length > 0) {
    const count = orphans.filter((o) => o.ia_score !== null && o.ia_score > 85).length;
    const closer = findBestCloser(prospecteurs, prospects);
    insights.push({
      id: "hot-orphans",
      severity: "warning",
      message: `${count} lead${count > 1 ? "s" : ""} score > 85 en attente d'assignation${closer ? ` — ${closer.name} est votre meilleur closer.` : "."}`,
      actionLabel: "Distribuer",
      actionHref: "/admin#orphelins",
      priority: 85,
    });
  }

  const rejectionRateWeek = computeRdvRejectionRate(prospects, "current");
  const rejectionRatePrev = computeRdvRejectionRate(prospects, "previous");

  if (
    rejectionRateWeek !== null &&
    rejectionRatePrev !== null &&
    rejectionRatePrev > 0
  ) {
    const delta = rejectionRateWeek - rejectionRatePrev;
    if (delta >= 10) {
      insights.push({
        id: "rdv-rejection-spike",
        severity: "warning",
        message: `Taux rejet RDV +${delta}% cette semaine (${rejectionRateWeek}% vs ${rejectionRatePrev}% la semaine dernière) — briefings prospecteurs à renforcer.`,
        actionLabel: "Team Pulse",
        actionHref: "/admin/equipe",
        priority: 90,
      });
    } else if (delta <= -10 && rejectionRateWeek < rejectionRatePrev) {
      insights.push({
        id: "rdv-rejection-improved",
        severity: "positive",
        message: `Qualité RDV en hausse : taux de rejet ${rejectionRateWeek}% (−${Math.abs(delta)} pts vs semaine dernière).`,
        actionLabel: "Statistiques",
        actionHref: "/admin/statistiques",
        priority: 40,
      });
    }
  } else if (rejectionRateWeek !== null && rejectionRateWeek >= 35) {
    insights.push({
      id: "rdv-rejection-high",
      severity: "warning",
      message: `Taux rejet RDV à ${rejectionRateWeek}% cette semaine — briefings prospecteurs à renforcer.`,
      actionLabel: "Team Pulse",
      actionHref: "/admin/equipe",
      priority: 75,
    });
  }

  const pendingStale = prospects.filter((p) => {
    if (p.rdv_status !== "PENDING" || !p.rdv_date) return false;
    return differenceInHours(now, new Date(p.rdv_date)) >= 24;
  });

  if (pendingStale.length > 0) {
    insights.push({
      id: "rdv-purgatory-stale",
      severity: "critical",
      message: `${pendingStale.length} RDV bloqué${pendingStale.length > 1 ? "s" : ""} en purgatoire depuis plus de 24h — validez ou rejetez pour débloquer le pipeline.`,
      actionLabel: "Purgatoire",
      actionHref: "/admin#purgatoire",
      priority: 95,
    });
  }

  const behindQuota = prospecteurs.filter((profile) => {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const validatedWeek = assigned.filter(
      (p) =>
        p.rdv_status === "VALIDATED" &&
        p.rdv_date !== null &&
        isCurrentWeek(p.rdv_date)
    ).length;
    return validatedWeek < WEEKLY_RDV_TARGET && WEEKLY_RDV_TARGET - validatedWeek <= 5;
  });

  if (behindQuota.length > 0) {
    const names = behindQuota
      .slice(0, 2)
      .map((p) => getProfileDisplayName(p))
      .join(", ");
    insights.push({
      id: "quota-risk",
      severity: "warning",
      message: `${behindQuota.length} prospecteur${behindQuota.length > 1 ? "s" : ""} en risque bonus volume (${names}${behindQuota.length > 2 ? "…" : ""}) — surveillez les RDV de fin de semaine.`,
      actionLabel: "Équipe",
      actionHref: "/admin/equipe",
      priority: 70,
    });
  }

  insights.push(...buildCallCoachingInsights(prospecteurs, todayCallDispositions));

  const aValiderCount = prospects.filter(
    (p) => p.assigned_to && p.statut.toLowerCase().includes("valider")
  ).length;

  if (aValiderCount >= 8) {
    insights.push({
      id: "avalider-bottleneck",
      severity: "opportunity",
      message: `${aValiderCount} leads assignés bloqués en « à valider » — relancez l'équipe sur l'approbation pour accélérer le pipeline.`,
      actionLabel: "Contrôle",
      actionHref: "/admin/controle",
      priority: 55,
    });
  }

  if (orphans.length >= 10) {
    insights.push({
      id: "orphans-backlog",
      severity: "opportunity",
      message: `${orphans.length} orphelins n8n en attente — la charge équipe risque de saturer si vous n'assignez pas cette semaine.`,
      actionLabel: "Orphelins",
      actionHref: "/admin#orphelins",
      priority: 60,
    });
  }

  const bonusUnlocked = prospecteurs.filter((profile) => {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const validatedWeek = assigned.filter(
      (p) =>
        p.rdv_status === "VALIDATED" &&
        p.rdv_date !== null &&
        isCurrentWeek(p.rdv_date)
    ).length;
    return validatedWeek >= WEEKLY_RDV_TARGET;
  });

  if (bonusUnlocked.length > 0) {
    const names = bonusUnlocked.map((p) => getProfileDisplayName(p)).join(", ");
    insights.push({
      id: "bonus-unlocked",
      severity: "positive",
      message: `Bonus volume débloqué pour ${names} — ${bonusUnlocked.length} prospecteur${bonusUnlocked.length > 1 ? "s" : ""} à 15 RDV validés cette semaine.`,
      actionLabel: "Finance",
      actionHref: "/admin/finance",
      priority: 35,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      severity: "positive",
      message:
        "Aucun signal critique détecté — pipeline sous contrôle. Continuez la surveillance via le Tour de Contrôle.",
      actionLabel: "Contrôle",
      actionHref: "/admin/controle",
      priority: 10,
    });
  }

  insights.sort((a, b) => b.priority - a.priority || severityRank(a.severity) - severityRank(b.severity));

  return {
    insights: insights.slice(0, 6),
    generatedAt: now.toISOString(),
  };
}
