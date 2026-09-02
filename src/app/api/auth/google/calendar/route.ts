import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getGoogleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { getCurrentProfile } from "@/lib/auth";

import { GOOGLE_CALENDAR_OAUTH_STATE_COOKIE } from "@/lib/google-oauth-state";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/creneaux?error=access", process.env.NEXT_PUBLIC_APP_URL));
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/creneaux?error=google_config", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const state = randomBytes(24).toString("hex");
  const authUrl = getGoogleAuthUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      new URL("/admin/creneaux?error=google_config", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
