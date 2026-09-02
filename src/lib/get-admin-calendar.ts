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

import { createClient } from "@/lib/supabase/server";
import type { RdvStatus } from "@/types/database.types";

const CALENDAR_RDV_SELECT =
  "id, entreprise, email, assigned_to, statut, ia_score, rdv_status, rdv_date";

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
  /** Clé ISO (yyyy-MM-dd) pour tri stable */
  dayKey: string;
  /** Ex. « Lundi 12 octobre » */
  label: string;
  items: AdminCalendarRdvItem[];
};

export type AdminRdvCalendar = {
  /** Tous les RDV triés chronologiquement */
  items: AdminCalendarRdvItem[];
  /** RDV PENDING dont la date est dépassée — validation admin oubliée */
  overdue: AdminCalendarRdvItem[];
  /** Libellé fixe pour la section « En retard » */
  overdueLabel: string;
  /** RDVs groupés par jour, ordre chronologique */
  days: AdminRdvCalendarDay[];
  /** Accès Map-like : dayKey → items (jours futurs/présents uniquement) */
  byDay: Map<string, AdminCalendarRdvItem[]>;
  totalCount: number;
  error: string | null;
};

function formatDayLabel(isoDate: string): string {
  const label = format(parseISO(isoDate), "EEEE d MMMM", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toCalendarItem(row: Record<string, unknown>): AdminCalendarRdvItem | null {
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

function buildCalendarFromItems(items: AdminCalendarRdvItem[]): Omit<
  AdminRdvCalendar,
  "error"
> {
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
      label: formatDayLabel(dayItems[0]!.rdv_date),
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

const EMPTY_CALENDAR: Omit<AdminRdvCalendar, "error"> = {
  items: [],
  overdue: [],
  overdueLabel: "En retard",
  days: [],
  byDay: new Map(),
  totalCount: 0,
};

/**
 * Calendrier admin des RDV PENDING / VALIDATED, triés par rdv_date.
 * Les PENDING passés non validés sont isolés dans `overdue` (« En retard »).
 */
export async function getAdminRdvCalendar(): Promise<AdminRdvCalendar> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospects")
      .select(CALENDAR_RDV_SELECT)
      .in("rdv_status", ["PENDING", "VALIDATED"])
      .not("rdv_date", "is", null)
      .order("rdv_date", { ascending: true });

    if (error) {
      return { ...EMPTY_CALENDAR, error: error.message };
    }

    const items = (data ?? [])
      .map((row) => toCalendarItem(row as Record<string, unknown>))
      .filter((item): item is AdminCalendarRdvItem => item !== null);

    return {
      ...buildCalendarFromItems(items),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger le calendrier RDV.";
    return { ...EMPTY_CALENDAR, error: message };
  }
}

/** Regroupe des items déjà chargés (tests ou agrégation client) */
export function groupAdminRdvCalendar(
  items: AdminCalendarRdvItem[]
): Omit<AdminRdvCalendar, "error"> {
  return buildCalendarFromItems(items);
}
