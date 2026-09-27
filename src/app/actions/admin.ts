"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function assignProspectAction(prospectId: string, prospecteurId: string) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Accès refusé." };
  }

  if (!prospectId || !prospecteurId) {
    return { error: "Prospect et prospecteur requis." };
  }

  const supabase = await createClient();

  const { data: prospecteur, error: prospecteurError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", prospecteurId)
    .eq("role", "prospecteur")
    .maybeSingle();

  if (prospecteurError || !prospecteur) {
    return { error: "Prospecteur introuvable." };
  }

  const { error } = await supabase
    .from("prospects")
    .update({ assigned_to: prospecteurId })
    .eq("id", prospectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/prospecteurs/[id]", "page");
  revalidatePath("/");

  return { success: true };
}

export type BulkAssignResult = {
  error?: string;
  assignedCount?: number;
  assignedIds?: string[];
};

export async function assignProspectsBulkAction(
  prospectIds: string[],
  prospecteurId: string
): Promise<BulkAssignResult> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Accès refusé." };
  }

  const uniqueIds = [...new Set(prospectIds.filter(Boolean))];

  if (uniqueIds.length === 0 || !prospecteurId) {
    return { error: "Sélectionnez au moins un lead et un prospecteur." };
  }

  const supabase = await createClient();

  const { data: prospecteur, error: prospecteurError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", prospecteurId)
    .eq("role", "prospecteur")
    .maybeSingle();

  if (prospecteurError || !prospecteur) {
    return { error: "Prospecteur introuvable." };
  }

  const { data, error } = await supabase
    .from("prospects")
    .update({ assigned_to: prospecteurId })
    .in("id", uniqueIds)
    .is("assigned_to", null)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const assignedIds = (data ?? []).map((row) => row.id);

  if (assignedIds.length === 0) {
    return { error: "Aucun lead orphelin n'a pu être assigné." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/prospecteurs/[id]", "page");
  revalidatePath("/");

  return { assignedCount: assignedIds.length, assignedIds };
}
