"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchProspectorLastActivity } from "@/app/actions/admin-data-actions";
import { ControlTowerPanel } from "@/components/admin/control-tower-panel";
import { AdminDataGate } from "@/components/admin/admin-data-gate";
import { AdminPanelSkeleton } from "@/components/admin/admin-panel-skeleton";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeControlTower } from "@/lib/control-tower";

export function AdminControleView() {
  const { prospects, prospecteurs, orphans, isReady, refreshKey } = useAdminData();
  const [lastActivityByProfileId, setLastActivityByProfileId] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    setLoading(true);

    void fetchProspectorLastActivity().then((result) => {
      if (cancelled) return;
      setLastActivityByProfileId(result.lastActivityByProfileId);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, refreshKey]);

  const controlStats = useMemo(
    () => computeControlTower(prospecteurs, prospects, orphans, lastActivityByProfileId),
    [prospecteurs, prospects, orphans, lastActivityByProfileId]
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
      ) : !isReady || loading ? (
        <AdminPanelSkeleton rows={4} />
      ) : (
        <ControlTowerPanel stats={controlStats} />
      )}
    </div>
  );
}
