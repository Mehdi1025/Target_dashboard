import {
  differenceInDays,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import {
  COMMISSION_RATE,
  VOLUME_BONUS_EUR,
  WEEKLY_RDV_TARGET,
} from "@/lib/bounty-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import type { ProfileRow, ProspectListItem } from "@/types/database.types";

export type ClosedDealRow = {
  prospectId: string;
  entreprise: string;
  prospecteurId: string;
  prospecteurName: string;
  dealAmount: number;
  commission: number;
  closedAt: string;
};

export type ProspecteurMoneyRow = {
  id: string;
  name: string;
  commissionsMonth: number;
  commissionsAllTime: number;
  volumeBonusUnlocked: boolean;
  volumeBonusAmount: number;
  validatedRdvWeek: number;
  projectedRdvWeek: number;
  projectedBonusWeek: number;
  dealsClosedMonth: number;
};

export type MoneyCommandStats = {
  totals: {
    commissionsMonth: number;
    commissionsAllTime: number;
    volumeBonusesWeek: number;
    volumeBonusesProjectedWeek: number;
    payrollWeek: number;
    payrollProjectedWeek: number;
    dealsClosedMonth: number;
    totalDealVolumeMonth: number;
  };
  closedDeals: ClosedDealRow[];
  prospecteurRows: ProspecteurMoneyRow[];
  weekProgress: {
    daysElapsed: number;
    daysTotal: number;
    daysRemaining: number;
    weekLabel: string;
  };
};

function isCurrentWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

function isCurrentMonth(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return isWithinInterval(date, {
    start: startOfMonth(now),
    end: endOfMonth(now),
  });
}

function isConverted(prospect: ProspectListItem): boolean {
  return (
    prospect.statut.toLowerCase().includes("converti") ||
    Number(prospect.deal_amount ?? 0) > 0
  );
}

function getClosedDate(prospect: ProspectListItem): string {
  return prospect.rdv_date ?? prospect.created_at;
}

function countValidatedThisWeek(prospects: ProspectListItem[]): number {
  return prospects.filter(
    (p) =>
      p.rdv_status === "VALIDATED" &&
      p.rdv_date !== null &&
      isCurrentWeek(p.rdv_date)
  ).length;
}

function projectWeeklyRdv(validatedSoFar: number, daysElapsed: number, daysTotal: number): number {
  if (validatedSoFar >= WEEKLY_RDV_TARGET) return validatedSoFar;
  const dailyRate = validatedSoFar / Math.max(1, daysElapsed);
  const projected = validatedSoFar + dailyRate * Math.max(0, daysTotal - daysElapsed);
  return Math.min(WEEKLY_RDV_TARGET, Math.round(projected));
}

export function computeMoneyCommand(
  prospecteurs: ProfileRow[],
  prospects: ProspectListItem[]
): MoneyCommandStats {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysTotal = differenceInDays(weekEnd, weekStart) + 1;
  const daysElapsed = Math.min(daysTotal, differenceInDays(now, weekStart) + 1);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const convertedProspects = prospects.filter(
    (p) => isConverted(p) && Number(p.commission_earned ?? 0) > 0
  );

  const closedDeals: ClosedDealRow[] = convertedProspects
    .map((prospect) => {
      const profile = prospecteurs.find((p) => p.id === prospect.assigned_to);
      return {
        prospectId: prospect.id,
        entreprise: prospect.entreprise,
        prospecteurId: prospect.assigned_to ?? "",
        prospecteurName: profile ? getProfileDisplayName(profile) : "Non assigné",
        dealAmount: Number(prospect.deal_amount ?? 0),
        commission: Number(prospect.commission_earned ?? 0),
        closedAt: getClosedDate(prospect),
      };
    })
    .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

  const closedDealsMonth = closedDeals.filter((deal) => isCurrentMonth(deal.closedAt));

  const commissionsMonth = closedDealsMonth.reduce((sum, deal) => sum + deal.commission, 0);
  const commissionsAllTime = closedDeals.reduce((sum, deal) => sum + deal.commission, 0);
  const totalDealVolumeMonth = closedDealsMonth.reduce((sum, deal) => sum + deal.dealAmount, 0);

  const prospecteurRows: ProspecteurMoneyRow[] = prospecteurs.map((profile) => {
    const assigned = prospects.filter((p) => p.assigned_to === profile.id);
    const validatedRdvWeek = countValidatedThisWeek(assigned);
    const volumeBonusUnlocked = validatedRdvWeek >= WEEKLY_RDV_TARGET;
    const projectedRdvWeek = projectWeeklyRdv(validatedRdvWeek, daysElapsed, daysTotal);
    const projectedBonusWeek = projectedRdvWeek >= WEEKLY_RDV_TARGET ? VOLUME_BONUS_EUR : 0;

    const monthDeals = assigned.filter(
      (p) =>
        isConverted(p) &&
        Number(p.commission_earned ?? 0) > 0 &&
        isCurrentMonth(getClosedDate(p))
    );

    return {
      id: profile.id,
      name: getProfileDisplayName(profile),
      commissionsMonth: monthDeals.reduce(
        (sum, p) => sum + Number(p.commission_earned ?? 0),
        0
      ),
      commissionsAllTime: assigned.reduce(
        (sum, p) => sum + Number(p.commission_earned ?? 0),
        0
      ),
      volumeBonusUnlocked,
      volumeBonusAmount: volumeBonusUnlocked ? VOLUME_BONUS_EUR : 0,
      validatedRdvWeek,
      projectedRdvWeek,
      projectedBonusWeek,
      dealsClosedMonth: monthDeals.length,
    };
  });

  const volumeBonusesWeek = prospecteurRows.reduce(
    (sum, row) => sum + row.volumeBonusAmount,
    0
  );
  const volumeBonusesProjectedWeek = prospecteurRows.reduce(
    (sum, row) => sum + row.projectedBonusWeek,
    0
  );

  const commissionsClosedThisWeek = closedDeals
    .filter((deal) => isCurrentWeek(deal.closedAt))
    .reduce((sum, deal) => sum + deal.commission, 0);

  const payrollWeek = commissionsClosedThisWeek + volumeBonusesWeek;
  const payrollProjectedWeek =
    commissionsClosedThisWeek + volumeBonusesProjectedWeek;

  return {
    totals: {
      commissionsMonth,
      commissionsAllTime,
      volumeBonusesWeek,
      volumeBonusesProjectedWeek,
      payrollWeek,
      payrollProjectedWeek,
      dealsClosedMonth: closedDealsMonth.length,
      totalDealVolumeMonth,
    },
    closedDeals: closedDealsMonth,
    prospecteurRows: prospecteurRows.sort(
      (a, b) =>
        b.commissionsMonth - a.commissionsMonth ||
        b.validatedRdvWeek - a.validatedRdvWeek
    ),
    weekProgress: {
      daysElapsed,
      daysTotal,
      daysRemaining,
      weekLabel: `Semaine en cours · ${daysRemaining}j restants`,
    },
  };
}

export function formatMoney(amount: number, precise = false): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: precise ? 2 : 0,
    maximumFractionDigits: precise ? 2 : 0,
  }).format(amount);
}

export function formatPercentRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export { COMMISSION_RATE, VOLUME_BONUS_EUR, WEEKLY_RDV_TARGET };
