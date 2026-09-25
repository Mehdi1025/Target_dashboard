"use server";

import { revalidatePath } from "next/cache";

import { trackActivity } from "@/app/actions/track-activity";
import { getCurrentProfile } from "@/lib/auth";
import { isProspectCountry, type ProspectCountry } from "@/lib/prospect-country";
import { createClient } from "@/lib/supabase/server";

export type ProspectActionResult = {
  ok: boolean;
  error?: string;
};

function revalidateProspectPaths() {
  revalidatePath("/");
  revalidatePath("/prospecteur");
  revalidatePath("/prospecteur/mission");
  revalidatePath("/prospecteur/briefing");
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export async function updateProspectCountry(
  prospectId: string,
  pays: ProspectCountry
): Promise<ProspectActionResult> {
  try {
    if (!isProspectCountry(pays)) {
      return { ok: false, error: "Pays invalide." };
    }

    const profile = await getCurrentProfile();
    if (!profile) {
      return { ok: false, error: "Accès refusé." };
    }

    const supabase = await createClient();
    const { data: prospect, error: fetchError } = await supabase
      .from("prospects")
      .select("id, assigned_to, entreprise, pays")
      .eq("id", prospectId)
      .maybeSingle();

    if (fetchError || !prospect) {
      return { ok: false, error: "Prospect introuvable." };
    }

    if (profile.role === "prospecteur" && prospect.assigned_to !== profile.id) {
      return { ok: false, error: "Ce lead ne vous est pas assigné." };
    }

    if (profile.role !== "admin" && profile.role !== "prospecteur") {
      return { ok: false, error: "Accès refusé." };
    }

    const { error: updateError } = await supabase
      .from("prospects")
      .update({ pays })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[updateProspectCountry]", updateError.message);
      return { ok: false, error: "Impossible de mettre à jour le pays." };
    }

    if (profile.role === "prospecteur") {
      await trackActivity("SAVE_NOTES", prospectId, {
        entreprise: prospect.entreprise,
        field: "pays",
        pays,
        previous_pays: prospect.pays,
      });
    }

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[updateProspectCountry] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}
