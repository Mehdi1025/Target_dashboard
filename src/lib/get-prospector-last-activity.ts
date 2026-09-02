import { createClient } from "@/lib/supabase/server";

export async function getProspectorLastActivity(): Promise<{
  lastActivityByProfileId: Record<string, string>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospector_logs")
      .select("profile_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return { lastActivityByProfileId: {}, error: error.message };
    }

    const lastActivityByProfileId: Record<string, string> = {};
    for (const row of data ?? []) {
      if (!lastActivityByProfileId[row.profile_id]) {
        lastActivityByProfileId[row.profile_id] = row.created_at;
      }
    }

    return { lastActivityByProfileId, error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger l'activité ECG.";
    return { lastActivityByProfileId: {}, error: message };
  }
}
