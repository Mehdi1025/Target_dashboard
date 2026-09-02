import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RdvCalendarSettingsRow } from "@/types/database.types";

const SETTINGS_KEY = "default";

export type RdvCalendarPublicSettings = {
  connected: boolean;
  connectedEmail: string | null;
  connectedAt: string | null;
  bookingUrl: string;
  googleConfigured: boolean;
  syncReady: boolean;
};

export async function getRdvCalendarSettingsForAdmin(): Promise<{
  settings: RdvCalendarSettingsRow | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rdv_calendar_settings")
      .select("*")
      .eq("singleton_key", SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      return { settings: null, error: error.message };
    }

    return { settings: data, error: null };
  } catch {
    return { settings: null, error: "Erreur serveur." };
  }
}

/** Lecture serveur avec refresh token — service role requis (prospecteurs ne voient pas le token). */
export async function getRdvCalendarSettingsInternal(): Promise<RdvCalendarSettingsRow | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("rdv_calendar_settings")
    .select("*")
    .eq("singleton_key", SETTINGS_KEY)
    .maybeSingle();

  return data;
}

export function toPublicCalendarSettings(
  settings: RdvCalendarSettingsRow | null,
  googleConfigured: boolean,
  syncReady: boolean
): RdvCalendarPublicSettings {
  return {
    connected: Boolean(settings?.google_refresh_token),
    connectedEmail: settings?.google_connected_email ?? null,
    connectedAt: settings?.google_connected_at ?? null,
    bookingUrl:
      settings?.google_booking_url ?? "https://calendar.app.google/jq8dJH2LtunSEPsz7",
    googleConfigured,
    syncReady,
  };
}

export async function upsertGoogleCalendarConnection(input: {
  refreshToken: string;
  connectedEmail: string | null;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("rdv_calendar_settings").upsert(
    {
      singleton_key: SETTINGS_KEY,
      google_refresh_token: input.refreshToken,
      google_connected_email: input.connectedEmail,
      google_connected_at: now,
      updated_at: now,
    },
    { onConflict: "singleton_key" }
  );

  return { ok: !error, error: error?.message };
}

export async function disconnectGoogleCalendar() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("rdv_calendar_settings")
    .update({
      google_refresh_token: null,
      google_connected_email: null,
      google_connected_at: null,
      updated_at: now,
    })
    .eq("singleton_key", SETTINGS_KEY);

  return { ok: !error, error: error?.message };
}
