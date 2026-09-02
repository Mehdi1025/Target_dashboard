import {
  addDays,
  compareAsc,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

import type { RdvStatus } from "@/types/database.types";

export type AdminCalendarRdvItem = {
  id: string;
  entreprise: string;
  email: string;
  assigned_to: string | null;
  statut: string;
  ia_score: number | null;
  rdv_status: RdvStatus;
  rdv_date: string;
};

export type AdminRdvCalendarDay = {
  dayKey: string;
  label: string;
  items: AdminCalendarRdvItem[];
};

export type AdminRdvCalendar = {
  items: AdminCalendarRdvItem[];
  overdue: AdminCalendarRdvItem[];
  overdueLabel: string;
  days: AdminRdvCalendarDay[];
  byDay: Map<string, AdminCalendarRdvItem[]>;
  totalCount: number;
  error: string | null;
};

export function formatAdminCalendarDayLabel(isoDate: string): string {
  const label = format(parseISO(isoDate), "EEEE d MMMM", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function toAdminCalendarItem(
  row: Record<string, unknown>
): AdminCalendarRdvItem | null {
  const rdvDate = row.rdv_date;
  if (typeof rdvDate !== "string" || !rdvDate) return null;

  const rdvStatus = row.rdv_status;
  if (rdvStatus !== "PENDING" && rdvStatus !== "VALIDATED") return null;

  return {
    id: String(row.id),
    entreprise: String(row.entreprise ?? ""),
    email: String(row.email ?? ""),
    assigned_to: typeof row.assigned_to === "string" ? row.assigned_to : null,
    statut: String(row.statut ?? ""),
    ia_score: typeof row.ia_score === "number" ? row.ia_score : null,
    rdv_status: rdvStatus,
    rdv_date: rdvDate,
  };
}

function sortByRdvDate(items: AdminCalendarRdvItem[]): AdminCalendarRdvItem[] {
  return [...items].sort((a, b) =>
    compareAsc(parseISO(a.rdv_date), parseISO(b.rdv_date))
  );
}

function isOverduePending(item: AdminCalendarRdvItem, todayStart: Date): boolean {
  if (item.rdv_status !== "PENDING") return false;
  return isBefore(startOfDay(parseISO(item.rdv_date)), todayStart);
}

export function buildAdminRdvCalendarFromItems(
  items: AdminCalendarRdvItem[]
): Omit<AdminRdvCalendar, "error"> {
  const todayStart = startOfDay(new Date());
  const sorted = sortByRdvDate(items);
  const overdue = sorted.filter((item) => isOverduePending(item, todayStart));
  const dayMap = new Map<string, AdminCalendarRdvItem[]>();

  for (const item of sorted) {
    if (isOverduePending(item, todayStart)) continue;

    const dayKey = format(parseISO(item.rdv_date), "yyyy-MM-dd");
    const bucket = dayMap.get(dayKey) ?? [];
    bucket.push(item);
    dayMap.set(dayKey, bucket);
  }

  const days: AdminRdvCalendarDay[] = Array.from(dayMap.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([dayKey, dayItems]) => ({
      dayKey,
      label: formatAdminCalendarDayLabel(dayItems[0]!.rdv_date),
      items: dayItems,
    }));

  return {
    items: sorted,
    overdue,
    overdueLabel: "En retard",
    days,
    byDay: dayMap,
    totalCount: sorted.length,
  };
}

/** Nombre de RDV PENDING prévus demain (J+1) */
export function countPendingRdvTomorrow(items: AdminCalendarRdvItem[]): number {
  const tomorrow = startOfDay(addDays(new Date(), 1));

  return items.filter(
    (item) =>
      item.rdv_status === "PENDING" &&
      isSameDay(startOfDay(parseISO(item.rdv_date)), tomorrow)
  ).length;
}

export const EMPTY_ADMIN_RDV_CALENDAR: Omit<AdminRdvCalendar, "error"> = {
  items: [],
  overdue: [],
  overdueLabel: "En retard",
  days: [],
  byDay: new Map(),
  totalCount: 0,
};

export function groupAdminRdvCalendar(
  items: AdminCalendarRdvItem[]
): Omit<AdminRdvCalendar, "error"> {
  return buildAdminRdvCalendarFromItems(items);
}
