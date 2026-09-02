import { redirect } from "next/navigation";

import { ProspectorPerformanceView } from "@/components/prospector-performance-view";
import { getCurrentProfile } from "@/lib/auth";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { getProspects } from "@/lib/get-prospects";
export const dynamic = "force-dynamic";

export default async function ProspecteurPage() {
  const profile = await getCurrentProfile();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { prospects, error } = await getProspects();
  const prospectorName = profile ? getProfileDisplayName(profile) : "Prospecteur";

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Target OS · Prospecteur
        </p>
        <div className="max-w-2xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Mes performances,{" "}
            <span className="text-gradient-brand">en un coup d&apos;œil.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Performance commerciale sur vos prospects assignés uniquement.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de connexion Supabase</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : profile ? (
        <ProspectorPerformanceView
          initialProspects={prospects}
          profileId={profile.id}
          prospectorName={prospectorName}
        />
      ) : null}
    </div>
  );
}
