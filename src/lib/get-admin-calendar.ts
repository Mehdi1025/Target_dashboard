import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  buildAdminRdvCalendarFromItems,
  EMPTY_ADMIN_RDV_CALENDAR,
  toAdminCalendarItem,
  type AdminRdvCalendar,
} from "@/lib/admin-calendar-shared";

export type {
  AdminCalendarRdvItem,
  AdminRdvCalendar,
  AdminRdvCalendarDay,
} from "@/lib/admin-calendar-shared";

export {
  countPendingRdvTomorrow,
  groupAdminRdvCalendar,
} from "@/lib/admin-calendar-shared";

const CALENDAR_RDV_SELECT =
  "id, entreprise, email, assigned_to, statut, ia_score, rdv_status, rdv_date";

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
      return { ...EMPTY_ADMIN_RDV_CALENDAR, error: error.message };
    }

    const items = (data ?? [])
      .map((row) => toAdminCalendarItem(row as Record<string, unknown>))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      ...buildAdminRdvCalendarFromItems(items),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger le calendrier RDV.";
    return { ...EMPTY_ADMIN_RDV_CALENDAR, error: message };
  }
}
