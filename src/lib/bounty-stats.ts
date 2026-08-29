import { endOfWeek, isWithinInterval, startOfWeek } from "date-fns";

import type { ProspectListItem, RdvStatus } from "@/types/database.types";

export const WEEKLY_RDV_TARGET = 15;
export const VOLUME_BONUS_EUR = 100;
export const COMMISSION_RATE = 0.1;

export type BountyStats = {
  validatedThisWeek: number;
  weeklyTarget: number;
  progressPct: number;
  volumeBonusUnlocked: boolean;
  totalCommissions: number;
  pendingCount: number;
  rejectedCount: number;
};

function isCurrentWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return isWithinInterval(date, { start, end });
}

export function computeBountyStats(prospects: ProspectListItem[]): BountyStats {
  const validatedThisWeek = prospects.filter(
    (p) =>
      p.rdv_status === "VALIDATED" &&
      p.rdv_date !== null &&
      isCurrentWeek(p.rdv_date)
  ).length;

  const progressPct = Math.min(
    100,
    Math.round((validatedThisWeek / WEEKLY_RDV_TARGET) * 100)
  );

  const totalCommissions = prospects.reduce(
    (sum, p) => sum + Number(p.commission_earned ?? 0),
    0
  );

  return {
    validatedThisWeek,
    weeklyTarget: WEEKLY_RDV_TARGET,
    progressPct,
    volumeBonusUnlocked: validatedThisWeek >= WEEKLY_RDV_TARGET,
    totalCommissions,
    pendingCount: prospects.filter((p) => p.rdv_status === "PENDING").length,
    rejectedCount: prospects.filter((p) => p.rdv_status === "REJECTED").length,
  };
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
