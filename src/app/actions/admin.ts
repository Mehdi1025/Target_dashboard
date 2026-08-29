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
