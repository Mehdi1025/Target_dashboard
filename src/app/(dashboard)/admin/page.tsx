import { redirect } from "next/navigation";

import { AdminKpiPanel } from "@/components/admin/admin-kpi-panel";
import { LiveActivityFeed } from "@/app/(dashboard)/admin/components/live-activity-feed";
import { RdvPurgatory } from "@/app/(dashboard)/admin/components/RdvPurgatory";
import { OrphanLeadsTable } from "@/components/admin/orphan-leads-table";
import { ProspecteursManagementTable } from "@/components/admin/prospecteurs-management-table";
import { getCurrentProfile } from "@/lib/auth";
import { computeAdminOverview } from "@/lib/admin-stats";
import { getOrphanProspects } from "@/lib/get-orphan-prospects";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Centre de commande Admin
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Gérez votre{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              équipe commerciale.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Supervisez les prospecteurs, répartissez les leads n8n et suivez la
            performance de chaque membre — sans accéder à leur espace opérationnel.
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
          <AdminKpiPanel overview={overview} />

          <section className="space-y-4">
            <RdvPurgatory prospects={prospects} prospecteurs={prospecteurs} />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">ECG Commercial</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Flux temps réel des micro-actions prospecteurs
              </p>
            </div>
            <LiveActivityFeed prospecteurs={prospecteurs} />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Équipe prospecteurs</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Performance individuelle et accès au détail de chaque membre
                </p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {overview.aValiderGlobal} à valider · {overview.approuvesGlobal} approuvés
                (global)
              </p>
            </div>
            <ProspecteursManagementTable rows={overview.prospecteurRows} />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Distribution des leads orphelins
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leads générés par n8n sans prospecteur — assignez-les manuellement
              </p>
            </div>
            <OrphanLeadsTable orphans={orphans} prospecteurs={prospecteurs} />
          </section>
        </>
      )}
    </div>
  );
}
