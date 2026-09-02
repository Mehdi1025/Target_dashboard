"use client";

import { useCallback, useEffect, useState } from "react";

import { BountyTracker } from "@/app/(dashboard)/prospecteur/components/BountyTracker";
import { DashboardKpi } from "@/components/dashboard-kpi";
import { MaJournee } from "@/components/ma-journee";
import { ProspectsBoard } from "@/components/prospects-board";
import { useProspectsRdvRealtime } from "@/hooks/use-prospects-rdv-realtime";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import type { ProspectListItem } from "@/types/prospect";

type ProspectorPipelineProps = {
  prospects: ProspectListItem[];
  profileId: string;
};

export function ProspectorPipeline({ prospects: initialProspects, profileId }: ProspectorPipelineProps) {
  const [prospects, setProspects] = useState(initialProspects);

  useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  const handleProspectPatch = useCallback(
    (prospectId: string, patch: Partial<ProspectListItem>) => {
      setProspects((current) =>
        current.map((prospect) =>
          prospect.id === prospectId ? { ...prospect, ...patch } : prospect
        )
      );
    },
    []
  );

  useProspectsRdvRealtime({
    profileId,
    prospects,
    onProspectPatch: handleProspectPatch,
  });

  const stats = computeDashboardStats(prospects);

  return (
    <>
      <MaJournee prospects={prospects} />
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
        <ProspectsBoard
          prospects={prospects}
          profileId={profileId}
          onProspectPatch={handleProspectPatch}
        />
      </section>
    </>
  );
}
