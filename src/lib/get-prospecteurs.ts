import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database.types";

export const getProspecteurs = cache(async (): Promise<{
  prospecteurs: ProfileRow[];
  error: string | null;
}> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "prospecteur")
      .order("created_at", { ascending: true });

    if (error) {
      return { prospecteurs: [], error: error.message };
    }

    return { prospecteurs: data ?? [], error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger les prospecteurs.";
    return { prospecteurs: [], error: message };
  }
});
