import { redirect } from "next/navigation";

import { BountyTracker } from "@/app/(dashboard)/prospecteur/components/BountyTracker";
import { DashboardKpi } from "@/components/dashboard-kpi";
import { ProspectsBoard } from "@/components/prospects-board";
import { getCurrentProfile } from "@/lib/auth";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { prospects, error } = await getProspects();
  const stats = computeDashboardStats(prospects);

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Target OS · Pipeline
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
              Vos prospects,{" "}
              <span className="text-gradient-brand">sous contrôle.</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Validez, priorisez et engagez les leads qui vous sont assignés.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de connexion Supabase</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <>
          <BountyTracker prospects={prospects} />
          <DashboardKpi stats={stats} />
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Pipeline actif</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.total} prospect{stats.total > 1 ? "s" : ""} · triés par score IA
                </p>
              </div>
            </div>
            <ProspectsBoard prospects={prospects} />
          </section>
        </>
      )}
    </div>
  );
}
