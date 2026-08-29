"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { COMMISSION_RATE } from "@/lib/bounty-stats";
import { createClient } from "@/lib/supabase/server";
import type { RdvStatus } from "@/types/database.types";

export type RdvActionResult = {
  ok: boolean;
  error?: string;
};

async function getProspectForAction(prospectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, assigned_to, rdv_status, statut")
    .eq("id", prospectId)
    .maybeSingle();

  if (error || !data) {
    return { prospect: null, supabase, error: "Prospect introuvable." };
  }

  return { prospect: data, supabase, error: null };
}

/** Prospecteur — déclare un RDV (passage en validation admin) */
export async function declareRDV(prospectId: string): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "prospecteur") {
      return { ok: false, error: "Accès refusé." };
    }

    const { prospect, supabase, error } = await getProspectForAction(prospectId);
    if (error || !prospect) {
      return { ok: false, error: error ?? "Prospect introuvable." };
    }

    if (prospect.assigned_to !== profile.id) {
      return { ok: false, error: "Ce lead ne vous est pas assigné." };
    }

    const currentStatus = prospect.rdv_status as RdvStatus;
    if (currentStatus === "PENDING") {
      return { ok: false, error: "RDV déjà en attente de validation." };
    }
    if (currentStatus === "VALIDATED") {
      return { ok: false, error: "RDV déjà validé pour ce lead." };
    }

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        rdv_status: "PENDING",
        rdv_date: new Date().toISOString(),
      })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[declareRDV]", updateError.message);
      return { ok: false, error: "Impossible de déclarer le RDV." };
    }

    revalidatePath("/");
    revalidatePath("/prospecteur");
    revalidatePath("/admin");

    return { ok: true };
  } catch (err) {
    console.error("[declareRDV] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Admin — valide ou rejette un RDV déclaré */
export async function validateRDV(
  prospectId: string,
  isApproved: boolean
): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    const { prospect, supabase, error } = await getProspectForAction(prospectId);
    if (error || !prospect) {
      return { ok: false, error: error ?? "Prospect introuvable." };
    }

    if (prospect.rdv_status !== "PENDING") {
      return { ok: false, error: "Ce RDV n'est pas en attente de validation." };
    }

    const newStatus: RdvStatus = isApproved ? "VALIDATED" : "REJECTED";

    const { error: updateError } = await supabase
      .from("prospects")
      .update({ rdv_status: newStatus })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[validateRDV]", updateError.message);
      return { ok: false, error: "Mise à jour impossible." };
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/prospecteur");

    return { ok: true };
  } catch (err) {
    console.error("[validateRDV] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Admin — marque un deal comme clos et calcule la commission 10% */
export async function convertDeal(
  prospectId: string,
  amount: number
): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Montant invalide." };
    }

    const { prospect, supabase, error } = await getProspectForAction(prospectId);
    if (error || !prospect) {
      return { ok: false, error: error ?? "Prospect introuvable." };
    }

    if (prospect.rdv_status !== "VALIDATED") {
      return { ok: false, error: "Le RDV doit être validé avant conversion." };
    }

    const commission = Math.round(amount * COMMISSION_RATE * 100) / 100;

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        deal_amount: amount,
        commission_earned: commission,
        statut: "Converti",
      })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[convertDeal]", updateError.message);
      return { ok: false, error: "Conversion impossible." };
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/prospecteur");

    return { ok: true };
  } catch (err) {
    console.error("[convertDeal] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}
