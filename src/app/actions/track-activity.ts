"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityMetadata } from "@/types/activity.types";
import type { ActionType, Json } from "@/types/database.types";

export type TrackActivityResult = {
  ok: boolean;
};

function toJsonMetadata(metadata?: ActivityMetadata): Json {
  if (!metadata) {
    return {};
  }

  return metadata as Json;
}

/**
 * Enregistre une micro-action prospecteur dans l'ECG Commercial.
 * Échoue silencieusement côté UI — log interne uniquement.
 */
export async function trackActivity(
  actionType: ActionType,
  prospectId?: string | null,
  metadata?: ActivityMetadata
): Promise<TrackActivityResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "prospecteur") {
      return { ok: false };
    }

    const { error } = await supabase.from("prospector_logs").insert({
      profile_id: user.id,
      action_type: actionType,
      prospect_id: prospectId ?? null,
      metadata: toJsonMetadata(metadata),
    });

    if (error) {
      console.error("[trackActivity] insert failed:", error.message);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("[trackActivity] unexpected error:", error);
    return { ok: false };
  }
}
