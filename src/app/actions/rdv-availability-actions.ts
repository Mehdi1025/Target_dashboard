"use server";

import { parseISO } from "date-fns";
import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import {
  filterSlotsByBusyIntervals,
  generateBookableSlots,
  groupSlotsByDay,
  type RdvAvailabilityRule,
} from "@/lib/rdv-slots";
import { fetchCalendarBusyIntervals } from "@/lib/google-calendar";
import { getRdvCalendarSettingsInternal } from "@/lib/rdv-calendar-settings";
import { createClient } from "@/lib/supabase/server";
import type { RdvAvailabilityRuleRow } from "@/types/database.types";

export type AvailabilityActionResult = {
  ok: boolean;
  error?: string;
};

export type RdvBookableSlotDto = {
  iso: string;
  dayKey: string;
  timeLabel: string;
  dayLabel: string;
};

export type RdvSlotsPayload = {
  slots: RdvBookableSlotDto[];
  daysWithSlots: string[];
  rulesCount: number;
  googleSynced: boolean;
  error: string | null;
};

function revalidateAvailabilityPaths() {
  revalidatePath("/");
  revalidatePath("/prospecteur");
  revalidatePath("/prospecteur/mission");
  revalidatePath("/prospecteur/briefing");
  revalidatePath("/admin");
  revalidatePath("/admin/creneaux");
}

async function fetchRulesAndBooked(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [rulesRes, bookedRes] = await Promise.all([
    supabase
      .from("rdv_availability_rules")
      .select("*")
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("prospects")
      .select("rdv_date")
      .in("rdv_status", ["PENDING", "VALIDATED"])
      .not("rdv_date", "is", null),
  ]);

  if (rulesRes.error) {
    return { rules: [] as RdvAvailabilityRule[], booked: [] as string[], error: rulesRes.error.message };
  }

  if (bookedRes.error) {
    return { rules: [] as RdvAvailabilityRule[], booked: [] as string[], error: bookedRes.error.message };
  }

  const rules = (rulesRes.data ?? []) as RdvAvailabilityRule[];
  const booked = (bookedRes.data ?? [])
    .map((row) => row.rdv_date as string)
    .filter(Boolean);

  return { rules, booked, error: null };
}

async function applyGoogleCalendarFilter(
  slots: ReturnType<typeof generateBookableSlots>
): Promise<{ slots: ReturnType<typeof generateBookableSlots>; googleSynced: boolean }> {
  const calendarSettings = await getRdvCalendarSettingsInternal();

  if (!calendarSettings?.google_refresh_token) {
    return { slots, googleSynced: false };
  }

  const busy = await fetchCalendarBusyIntervals(
    calendarSettings.google_refresh_token,
    calendarSettings.google_calendar_id,
    { timeZone: calendarSettings.timezone }
  );

  return {
    slots: filterSlotsByBusyIntervals(slots, busy),
    googleSynced: true,
  };
}

export async function getRdvBookableSlots(): Promise<RdvSlotsPayload> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { slots: [], daysWithSlots: [], rulesCount: 0, googleSynced: false, error: "Non authentifié." };
    }

    const supabase = await createClient();
    const { rules, booked, error } = await fetchRulesAndBooked(supabase);

    if (error) {
      return { slots: [], daysWithSlots: [], rulesCount: 0, googleSynced: false, error };
    }

    const generated = generateBookableSlots(rules, booked);
    const { slots: filtered, googleSynced } = await applyGoogleCalendarFilter(generated);
    const daysWithSlots = [...groupSlotsByDay(filtered).keys()];
    const slots = filtered.map((slot) => ({
      iso: slot.iso,
      dayKey: slot.dayKey,
      timeLabel: slot.timeLabel,
      dayLabel: slot.dayLabel,
    }));

    return {
      slots,
      daysWithSlots,
      rulesCount: rules.length,
      googleSynced,
      error: null,
    };
  } catch {
    return { slots: [], daysWithSlots: [], rulesCount: 0, googleSynced: false, error: "Erreur serveur." };
  }
}

export async function getRdvAvailabilityRules(): Promise<{
  rules: RdvAvailabilityRuleRow[];
  error: string | null;
}> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { rules: [], error: "Accès admin requis." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rdv_availability_rules")
      .select("*")
      .order("day_of_week")
      .order("start_time");

    if (error) {
      return { rules: [], error: error.message };
    }

    return { rules: (data ?? []) as RdvAvailabilityRuleRow[], error: null };
  } catch {
    return { rules: [], error: "Erreur serveur." };
  }
}

export type CreateAvailabilityRuleInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes?: number;
  label?: string | null;
};

export async function createRdvAvailabilityRule(
  input: CreateAvailabilityRuleInput
): Promise<AvailabilityActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    if (input.day_of_week < 1 || input.day_of_week > 7) {
      return { ok: false, error: "Jour invalide." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("rdv_availability_rules").insert({
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      slot_duration_minutes: input.slot_duration_minutes ?? 30,
      label: input.label ?? null,
      is_active: true,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAvailabilityPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur serveur." };
  }
}

export async function toggleRdvAvailabilityRule(
  ruleId: string,
  isActive: boolean
): Promise<AvailabilityActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("rdv_availability_rules")
      .update({ is_active: isActive })
      .eq("id", ruleId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAvailabilityPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur serveur." };
  }
}

export async function deleteRdvAvailabilityRule(
  ruleId: string
): Promise<AvailabilityActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("rdv_availability_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAvailabilityPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Validation serveur d'un créneau avant réservation */
export async function validateRdvSlot(slotIso: string): Promise<AvailabilityActionResult> {
  try {
    const supabase = await createClient();
    const { rules, booked, error } = await fetchRulesAndBooked(supabase);

    if (error) {
      return { ok: false, error };
    }

    if (rules.length === 0) {
      return { ok: false, error: "Aucune disponibilité configurée par l'admin." };
    }

    const generated = generateBookableSlots(rules, booked);
    const { slots: filtered } = await applyGoogleCalendarFilter(generated);
    const normalized = parseISO(slotIso).toISOString();

    if (!filtered.some((slot) => slot.iso === normalized)) {
      return { ok: false, error: "Ce créneau n'est plus disponible." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur serveur." };
  }
}
