import { addDays, startOfDay } from "date-fns";
import { google } from "googleapis";

import { RDV_SLOT_HORIZON_DAYS } from "@/lib/rdv-slots";

export type BusyInterval = { start: Date; end: Date };

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const DEFAULT_TIMEZONE = "Europe/Paris";

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/auth/google/calendar/callback`;
}

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, getGoogleRedirectUri());
}

export function getGoogleAuthUrl(state: string): string | null {
  const oauth2 = getGoogleOAuthClient();
  if (!oauth2) return null;

  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [CALENDAR_SCOPE],
    state,
  });
}

export async function exchangeGoogleAuthCode(code: string) {
  const oauth2 = getGoogleOAuthClient();
  if (!oauth2) {
    throw new Error("Google OAuth non configuré.");
  }

  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

export async function getGoogleAccountEmail(refreshToken: string): Promise<string | null> {
  const oauth2 = getGoogleOAuthClient();
  if (!oauth2) return null;

  oauth2.setCredentials({ refresh_token: refreshToken });

  try {
    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const { data } = await oauth2Api.userinfo.get();
    return data.email ?? null;
  } catch {
    return null;
  }
}

export async function fetchCalendarBusyIntervals(
  refreshToken: string,
  calendarId: string,
  options?: { horizonDays?: number; now?: Date; timeZone?: string }
): Promise<BusyInterval[]> {
  const oauth2 = getGoogleOAuthClient();
  if (!oauth2) return [];

  oauth2.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const now = options?.now ?? new Date();
  const horizonDays = options?.horizonDays ?? RDV_SLOT_HORIZON_DAYS;
  const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;
  const timeMin = now.toISOString();
  const timeMax = addDays(startOfDay(now), horizonDays).toISOString();

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone,
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy ?? [];

    return busy
      .filter((interval): interval is { start: string; end: string } =>
        Boolean(interval.start && interval.end)
      )
      .map((interval) => ({
        start: new Date(interval.start),
        end: new Date(interval.end),
      }));
  } catch (err) {
    console.error("[fetchCalendarBusyIntervals]", err);
    return [];
  }
}

export type CreateRdvEventInput = {
  slotStartIso: string;
  slotEndIso: string;
  entreprise: string;
  prospectEmail?: string | null;
  prospectName?: string | null;
  prospecteurName?: string | null;
  timeZone?: string;
};

export async function createRdvCalendarEvent(
  refreshToken: string,
  calendarId: string,
  input: CreateRdvEventInput
): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  const oauth2 = getGoogleOAuthClient();
  if (!oauth2) {
    return { ok: false, error: "Google Calendar non configuré." };
  }

  oauth2.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });
  const timeZone = input.timeZone ?? DEFAULT_TIMEZONE;

  const descriptionLines = [
    "RDV booké via Target OS",
    input.prospectName ? `Contact : ${input.prospectName}` : null,
    input.prospectEmail ? `Email : ${input.prospectEmail}` : null,
    input.prospecteurName ? `Prospecteur : ${input.prospecteurName}` : null,
  ].filter(Boolean);

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `RDV Target OS — ${input.entreprise}`,
        description: descriptionLines.join("\n"),
        start: { dateTime: input.slotStartIso, timeZone },
        end: { dateTime: input.slotEndIso, timeZone },
      },
    });

    return { ok: true, eventId: response.data.id ?? undefined };
  } catch (err) {
    console.error("[createRdvCalendarEvent]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Impossible de créer l'événement Google.",
    };
  }
}
