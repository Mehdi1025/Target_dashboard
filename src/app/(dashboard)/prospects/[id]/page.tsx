import { notFound } from "next/navigation";

import { ProspectDetailView } from "@/components/prospect-detail";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PROSPECT_DETAIL_SELECT, type ProspectDetailCore } from "@/types/prospect";

export const dynamic = "force-dynamic";

type ProspectPageProps = {
  params: Promise<{ id: string }>;
};

async function getProspect(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prospects")
      .select(PROSPECT_DETAIL_SELECT)
      .eq("id", id)
      .single();

    if (error || !data) {
      return { prospect: null, error: error?.message ?? "Prospect introuvable." };
    }

    return {
      prospect: data as unknown as ProspectDetailCore,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger le prospect.";

    return { prospect: null, error: message };
  }
}

export default async function ProspectPage({ params }: ProspectPageProps) {
  const { id } = await params;
  const [{ prospect, error }, profile] = await Promise.all([getProspect(id), getCurrentProfile()]);

  if (error?.includes("introuvable") || (!prospect && !error)) {
    notFound();
  }

  if (error || !prospect) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
        <p className="font-medium">Erreur de chargement</p>
        <p className="mt-1 text-destructive/80">{error}</p>
      </div>
    );
  }

  const profileId =
    profile?.role === "prospecteur" && prospect.assigned_to === profile.id
      ? profile.id
      : undefined;

  return <ProspectDetailView prospect={prospect} profileId={profileId} />;
}
