import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { OrphanProspectItem } from "@/types/database.types";

export const getOrphanProspects = cache(async (): Promise<{
  orphans: OrphanProspectItem[];
  error: string | null;
}> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospects")
      .select("id, entreprise, email, ia_score, statut, created_at")
      .is("assigned_to", null)
      .order("created_at", { ascending: false });

    if (error) {
      return { orphans: [], error: error.message };
    }

    return { orphans: (data ?? []) as OrphanProspectItem[], error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger les leads orphelins.";
    return { orphans: [], error: message };
  }
});
