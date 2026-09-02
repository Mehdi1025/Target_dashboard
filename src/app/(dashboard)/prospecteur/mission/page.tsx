import { redirect } from "next/navigation";

import { MissionQueuePanel } from "@/components/mission-queue-panel";
import { getCurrentProfile } from "@/lib/auth";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function MissionPage() {
  const profile = await getCurrentProfile();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { prospects, error } = await getProspects();

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Target OS · Mission
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Ta prochaine action,{" "}
            <span className="text-gradient-brand">sans réfléchir.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            File intelligente priorisée pour atteindre vos 15 RDV et maximiser vos
            commissions — une mission à la fois.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de connexion Supabase</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : profile ? (
        <MissionQueuePanel initialProspects={prospects} profileId={profile.id} />
      ) : null}
    </div>
  );
}
