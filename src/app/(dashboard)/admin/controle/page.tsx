import { redirect } from "next/navigation";

import { ControlTowerPanel } from "@/components/admin/control-tower-panel";
import { getCurrentProfile } from "@/lib/auth";
import { computeControlTower } from "@/lib/control-tower";
import { getOrphanProspects } from "@/lib/get-orphan-prospects";
import { getProspectorLastActivity } from "@/lib/get-prospector-last-activity";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function AdminControlePage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [
    { prospects, error: prospectsError },
    { prospecteurs, error: prospecteursError },
    { orphans, error: orphansError },
    { lastActivityByProfileId, error: activityError },
  ] = await Promise.all([
    getProspects(),
    getProspecteurs(),
    getOrphanProspects(),
    getProspectorLastActivity(),
  ]);

  const error = prospectsError ?? prospecteursError ?? orphansError ?? activityError;
  const controlStats = computeControlTower(
    prospecteurs,
    prospects,
    orphans,
    lastActivityByProfileId
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Tour de Contrôle
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Alertes &{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              actions urgentes.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            RDV en retard, orphelins, quotas et inactivité ECG — priorisé pour décider en
            quelques secondes.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <ControlTowerPanel stats={controlStats} />
      )}
    </div>
  );
}
