import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GOOGLE_CALENDAR_OAUTH_STATE_COOKIE } from "@/lib/google-oauth-state";
import {
  exchangeGoogleAuthCode,
  getGoogleAccountEmail,
} from "@/lib/google-calendar";
import { getCurrentProfile } from "@/lib/auth";
import { upsertGoogleCalendarConnection } from "@/lib/rdv-calendar-settings";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectBase = `${appUrl.replace(/\/$/, "")}/admin/creneaux`;

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(`${redirectBase}?error=access`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${redirectBase}?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=google_missing`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE);

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${redirectBase}?error=google_state`);
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${redirectBase}?error=google_no_refresh`);
    }

    const connectedEmail = await getGoogleAccountEmail(tokens.refresh_token);
    const result = await upsertGoogleCalendarConnection({
      refreshToken: tokens.refresh_token,
      connectedEmail,
    });

    if (!result.ok) {
      return NextResponse.redirect(`${redirectBase}?error=google_save`);
    }

    return NextResponse.redirect(`${redirectBase}?connected=1`);
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=google_exchange`);
  }
}
