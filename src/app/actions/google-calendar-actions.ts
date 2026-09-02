"use server";

import { revalidatePath } from "next/cache";

import {
  disconnectGoogleCalendar,
  getRdvCalendarSettingsForAdmin,
  toPublicCalendarSettings,
  type RdvCalendarPublicSettings,
} from "@/lib/rdv-calendar-settings";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";

export type GoogleCalendarActionResult = {
  ok: boolean;
  error?: string;
};

export async function getGoogleCalendarStatus(): Promise<RdvCalendarPublicSettings> {
  const { settings } = await getRdvCalendarSettingsForAdmin();
  const googleConfigured = isGoogleCalendarConfigured();
  const syncReady = googleConfigured && Boolean(createAdminClient());

  return toPublicCalendarSettings(settings, googleConfigured, syncReady);
}

export async function disconnectGoogleCalendarAction(): Promise<GoogleCalendarActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Accès admin requis." };
  }

  const result = await disconnectGoogleCalendar();
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Déconnexion impossible." };
  }

  revalidatePath("/admin/creneaux");
  return { ok: true };
}
