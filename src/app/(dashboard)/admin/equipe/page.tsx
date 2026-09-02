import { redirect } from "next/navigation";

import { TeamFichesGrid } from "@/components/admin/team-fiches-grid";
import { TeamPulsePanel } from "@/components/admin/team-pulse-panel";
import { getCurrentProfile } from "@/lib/auth";
import { getProspectorActivitySnapshot } from "@/lib/get-prospector-activity-snapshot";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";
import { computeTeamPulse } from "@/lib/team-pulse";

export const dynamic = "force-dynamic";

export default async function AdminEquipePage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [
    { prospecteurs, error: prospecteursError },
    { prospects, error: prospectsError },
    { snapshot, error: activityError },
  ] = await Promise.all([
    getProspecteurs(),
    getProspects(),
    getProspectorActivitySnapshot(),
  ]);

  const error = prospecteursError ?? prospectsError ?? activityError;
  const teamPulse = computeTeamPulse(prospecteurs, prospects, snapshot);

  return (
    <div className="flex flex-col gap-12">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Équipe
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Team Pulse &{" "}
            <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
              fiches équipe.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Supervisez l&apos;activité ECG en direct, les quotas RDV et accédez aux fiches
            détaillées de chaque prospecteur.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <>
          <TeamPulsePanel initialSnapshot={teamPulse} />
          <TeamFichesGrid members={teamPulse.members} />
        </>
      )}
    </div>
  );
}
