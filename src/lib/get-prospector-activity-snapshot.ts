import { startOfDay } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import type { OracleCallDispositionEvent } from "@/lib/oracle-admin";
import type { ActivityMetadata } from "@/types/activity.types";
import type { CallDisposition } from "@/types/database.types";
import { CALL_DISPOSITIONS } from "@/types/database.types";

function isCallDisposition(value: unknown): value is CallDisposition {
  return (
    typeof value === "string" &&
    (CALL_DISPOSITIONS as readonly string[]).includes(value)
  );
}

export type ProspectorLastLog = {
  action_type: string;
  created_at: string;
  metadata: ActivityMetadata;
};

export type ProspectorActivitySnapshot = {
  lastActivityByProfileId: Record<string, string>;
  lastLogByProfileId: Record<string, ProspectorLastLog>;
};

export async function getProspectorActivitySnapshot(): Promise<{
  snapshot: ProspectorActivitySnapshot;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospector_logs")
      .select("profile_id, action_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return {
        snapshot: { lastActivityByProfileId: {}, lastLogByProfileId: {} },
        error: error.message,
      };
    }

    const lastActivityByProfileId: Record<string, string> = {};
    const lastLogByProfileId: Record<string, ProspectorLastLog> = {};

    for (const row of data ?? []) {
      if (!lastActivityByProfileId[row.profile_id]) {
        lastActivityByProfileId[row.profile_id] = row.created_at;
        lastLogByProfileId[row.profile_id] = {
          action_type: row.action_type,
          created_at: row.created_at,
          metadata: (row.metadata ?? {}) as ActivityMetadata,
        };
      }
    }

    return {
      snapshot: { lastActivityByProfileId, lastLogByProfileId },
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger l'activité ECG.";
    return {
      snapshot: { lastActivityByProfileId: {}, lastLogByProfileId: {} },
      error: message,
    };
  }
}

/** Issues d'appel CALL_DISPOSITION enregistrées depuis minuit (Oracle admin) */
export async function getTodayCallDispositionEvents(): Promise<{
  events: OracleCallDispositionEvent[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const dayStart = startOfDay(new Date()).toISOString();

    const { data, error } = await supabase
      .from("prospector_logs")
      .select("profile_id, metadata, created_at")
      .eq("action_type", "CALL_DISPOSITION")
      .gte("created_at", dayStart);

    if (error) {
      return { events: [], error: error.message };
    }

    const events: OracleCallDispositionEvent[] = [];

    for (const row of data ?? []) {
      const metadata = (row.metadata ?? {}) as ActivityMetadata;
      if (!isCallDisposition(metadata.disposition)) continue;

      events.push({
        profileId: row.profile_id,
        disposition: metadata.disposition,
      });
    }

    return { events, error: null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger les issues d'appel du jour.";
    return { events: [], error: message };
  }
}
