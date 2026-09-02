"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchProspectorActivitySnapshot } from "@/app/actions/admin-data-actions";
import { TeamFichesGrid } from "@/components/admin/team-fiches-grid";
import { TeamPulsePanel } from "@/components/admin/team-pulse-panel";
import { AdminPanelSkeleton } from "@/components/admin/admin-panel-skeleton";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeTeamPulse } from "@/lib/team-pulse";
import type { ProspectorActivitySnapshot } from "@/lib/get-prospector-activity-snapshot";

const EMPTY_SNAPSHOT: ProspectorActivitySnapshot = {
  lastActivityByProfileId: {},
  lastLogByProfileId: {},
};

export function AdminEquipeView() {
  const { prospects, prospecteurs, isReady, refreshKey } = useAdminData();
  const [snapshot, setSnapshot] = useState<ProspectorActivitySnapshot>(EMPTY_SNAPSHOT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    setLoading(true);

    void fetchProspectorActivitySnapshot().then((result) => {
      if (cancelled) return;
      setSnapshot(result.snapshot);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, refreshKey]);

  const teamPulse = useMemo(
    () => computeTeamPulse(prospecteurs, prospects, snapshot),
    [prospecteurs, prospects, snapshot]
  );

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
      ) : !isReady || loading ? (
        <AdminPanelSkeleton rows={5} />
      ) : (
        <>
          <TeamPulsePanel initialSnapshot={teamPulse} />
          <TeamFichesGrid members={teamPulse.members} />
        </>
      )}
    </div>
  );
}
