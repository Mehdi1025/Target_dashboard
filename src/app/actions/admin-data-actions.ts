"use server";

import { getOrphanProspects } from "@/lib/get-orphan-prospects";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";
import { getProspectorLastActivity } from "@/lib/get-prospector-last-activity";
import { getProspectorActivitySnapshot } from "@/lib/get-prospector-activity-snapshot";
import { getTodayCallDispositionEvents } from "@/lib/get-prospector-activity-snapshot";
import { getAdminRdvCalendar } from "@/lib/get-admin-calendar";

export async function fetchProspectorLastActivity() {
  return getProspectorLastActivity();
}

export async function fetchProspectorActivitySnapshot() {
  return getProspectorActivitySnapshot();
}

export async function fetchTodayCallDispositionEvents() {
  return getTodayCallDispositionEvents();
}

export async function fetchAdminRdvCalendar() {
  return getAdminRdvCalendar();
}

/** Rafraîchit les données partagées admin (après mutation). */
export async function refreshAdminSharedData() {
  const [prospectsRes, prospecteursRes, orphansRes] = await Promise.all([
    getProspects(),
    getProspecteurs(),
    getOrphanProspects(),
  ]);

  return {
    prospects: prospectsRes.prospects,
    prospecteurs: prospecteursRes.prospecteurs,
    orphans: orphansRes.orphans,
    error:
      prospectsRes.error ?? prospecteursRes.error ?? orphansRes.error ?? null,
  };
}
