"use server";

import { revalidatePath } from "next/cache";
import { isValid, parseISO, set } from "date-fns";

import { trackActivity } from "@/app/actions/track-activity";
import { getCurrentProfile } from "@/lib/auth";
import { COMMISSION_RATE } from "@/lib/bounty-stats";
import { isRdvRejectionReason } from "@/lib/rdv-rejection-reasons";
import { createClient } from "@/lib/supabase/server";
import type { CallDisposition, RdvRejectionReason, RdvStatus } from "@/types/database.types";
import { CALL_DISPOSITIONS, CALL_DISPOSITION_STATUTS } from "@/types/database.types";

export type RdvActionResult = {
  ok: boolean;
  error?: string;
};

function isCallDisposition(value: string): value is CallDisposition {
  return (CALL_DISPOSITIONS as readonly string[]).includes(value);
}

function revalidateProspectPaths() {
  revalidatePath("/");
  revalidatePath("/prospecteur");
  revalidatePath("/prospecteur/mission");
  revalidatePath("/prospecteur/briefing");
  revalidatePath("/admin");
  revalidatePath("/admin/finance");
}

async function getProspectForAction(prospectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, assigned_to, rdv_status, statut, entreprise")
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
        rdv_rejection_reason: null,
      })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[declareRDV]", updateError.message);
      return { ok: false, error: "Impossible de déclarer le RDV." };
    }

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[declareRDV] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Prospecteur — annule un RDV en attente de validation admin */
export async function cancelPendingRDV(
  prospectId: string,
  prospecteurId: string
): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "prospecteur") {
      return { ok: false, error: "Accès refusé." };
    }

    if (profile.id !== prospecteurId) {
      return { ok: false, error: "Identifiant prospecteur invalide." };
    }

    const { prospect, supabase, error } = await getProspectForAction(prospectId);
    if (error || !prospect) {
      return { ok: false, error: error ?? "Prospect introuvable." };
    }

    if (prospect.assigned_to !== prospecteurId) {
      return { ok: false, error: "Ce lead ne vous est pas assigné." };
    }

    if (prospect.rdv_status !== "PENDING") {
      return { ok: false, error: "Aucun RDV en attente à annuler." };
    }

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        rdv_status: "NONE",
        rdv_date: null,
        rdv_rejection_reason: null,
      })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[cancelPendingRDV]", updateError.message);
      return { ok: false, error: "Impossible d'annuler le RDV." };
    }

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[cancelPendingRDV] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Prospecteur — enregistre l'issue d'un appel et trace l'ECG */
export async function updateCallDisposition(
  prospectId: string,
  disposition: CallDisposition
): Promise<RdvActionResult> {
  try {
    if (!isCallDisposition(disposition)) {
      return { ok: false, error: "Issue d'appel invalide." };
    }

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

    const newStatut = CALL_DISPOSITION_STATUTS[disposition];

    const { error: updateError } = await supabase
      .from("prospects")
      .update({ statut: newStatut })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[updateCallDisposition]", updateError.message);
      return { ok: false, error: "Impossible de mettre à jour le statut." };
    }

    await trackActivity("CALL_DISPOSITION", prospectId, {
      disposition,
      statut: newStatut,
      entreprise: prospect.entreprise,
    });

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[updateCallDisposition] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Admin — valide ou rejette un RDV déclaré */
export async function validateRDV(
  prospectId: string,
  isApproved: boolean,
  rejectionReason?: RdvRejectionReason
): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    if (!isApproved) {
      if (!rejectionReason || !isRdvRejectionReason(rejectionReason)) {
        return { ok: false, error: "Motif de rejet requis." };
      }
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
      .update({
        rdv_status: newStatus,
        rdv_rejection_reason: isApproved ? null : rejectionReason ?? null,
      })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[validateRDV]", updateError.message);
      return { ok: false, error: "Mise à jour impossible." };
    }

    revalidateProspectPaths();

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

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[convertDeal] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}

/** Admin — reporte un RDV PENDING ou VALIDATED à une nouvelle date */
export async function rescheduleRDV(
  prospectId: string,
  newDate: string
): Promise<RdvActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Accès admin requis." };
    }

    const newDay = parseISO(newDate);
    if (!isValid(newDay)) {
      return { ok: false, error: "Date invalide." };
    }

    const supabase = await createClient();
    const { data: prospect, error } = await supabase
      .from("prospects")
      .select("id, rdv_status, rdv_date")
      .eq("id", prospectId)
      .maybeSingle();

    if (error || !prospect) {
      return { ok: false, error: "Prospect introuvable." };
    }

    if (prospect.rdv_status !== "PENDING" && prospect.rdv_status !== "VALIDATED") {
      return { ok: false, error: "Ce RDV ne peut pas être reporté." };
    }

    if (!prospect.rdv_date) {
      return { ok: false, error: "Aucune date RDV à reporter." };
    }

    const existing = parseISO(prospect.rdv_date);
    const merged = set(newDay, {
      hours: existing.getHours(),
      minutes: existing.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    const { error: updateError } = await supabase
      .from("prospects")
      .update({ rdv_date: merged.toISOString() })
      .eq("id", prospectId);

    if (updateError) {
      console.error("[rescheduleRDV]", updateError.message);
      return { ok: false, error: "Impossible de reporter le RDV." };
    }

    revalidateProspectPaths();

    return { ok: true };
  } catch (err) {
    console.error("[rescheduleRDV] unexpected:", err);
    return { ok: false, error: "Erreur serveur." };
  }
}
