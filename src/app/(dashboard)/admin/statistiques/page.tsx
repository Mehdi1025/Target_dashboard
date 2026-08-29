import { redirect } from "next/navigation";

import { AdminStatisticsSection } from "@/components/admin/admin-statistics-section";
import { getCurrentProfile } from "@/lib/auth";
import { computeAdminOverview, computeAdminStatistics } from "@/lib/admin-stats";
import { getOrphanProspects } from "@/lib/get-orphan-prospects";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function AdminStatistiquesPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [
    { prospects, error: prospectsError },
    { prospecteurs, error: prospecteursError },
    { orphans, error: orphansError },
  ] = await Promise.all([getProspects(), getProspecteurs(), getOrphanProspects()]);

  const error = prospectsError ?? prospecteursError ?? orphansError;
  const overview = computeAdminOverview(prospecteurs, prospects, orphans.length);
  const statistics = computeAdminStatistics(
    prospecteurs,
    prospects,
    orphans.length,
    overview
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Analytics Admin
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Statistiques{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              globales.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Analyse consolidée du pipeline, de la qualité IA et de la performance de
            l&apos;équipe commerciale.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <AdminStatisticsSection statistics={statistics} />
      )}
    </div>
  );
}
