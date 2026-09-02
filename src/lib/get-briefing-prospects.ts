import { createClient } from "@/lib/supabase/server";
import { PROSPECT_BRIEFING_SELECT, type BriefingProspect } from "@/types/prospect";

export async function getBriefingProspects(profileId?: string): Promise<{
  prospects: BriefingProspect[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("prospects")
      .select(PROSPECT_BRIEFING_SELECT)
      .order("ia_score", { ascending: false, nullsFirst: false });

    if (profileId) {
      query = query.eq("assigned_to", profileId);
    }

    const { data, error } = await query;

    if (error) {
      return { prospects: [], error: error.message };
    }

    return { prospects: (data ?? []) as unknown as BriefingProspect[], error: null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de se connecter à Supabase.";

    return { prospects: [], error: message };
  }
}