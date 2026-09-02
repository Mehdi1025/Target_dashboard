import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { PROSPECT_LIST_SELECT, type ProspectListItem } from "@/types/prospect";

export const getProspects = cache(async (): Promise<{
  prospects: ProspectListItem[];
  error: string | null;
}> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospects")
      .select(PROSPECT_LIST_SELECT)
      .order("ia_score", { ascending: false, nullsFirst: false });

    if (error) {
      return { prospects: [], error: error.message };
    }

    return { prospects: (data ?? []) as unknown as ProspectListItem[], error: null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de se connecter à Supabase.";

    return { prospects: [], error: message };
  }
});
