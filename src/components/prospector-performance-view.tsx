"use client";

import { useCallback, useEffect, useState } from "react";

import { BountyTracker } from "@/app/(dashboard)/prospecteur/components/BountyTracker";
import { DashboardKpi } from "@/components/dashboard-kpi";
import { ProspectorStatsPanel } from "@/components/prospector-stats-panel";
import { useProspectsRdvRealtime } from "@/hooks/use-prospects-rdv-realtime";
import { computeDashboardStats, computeProspectorStats } from "@/lib/dashboard-stats";
import type { ProspectListItem } from "@/types/prospect";

type ProspectorPerformanceViewProps = {
  initialProspects: ProspectListItem[];
  profileId: string;
  prospectorName: string;
};

export function ProspectorPerformanceView({
  initialProspects,
  profileId,
  prospectorName,
}: ProspectorPerformanceViewProps) {
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
  const prospectorStats = computeProspectorStats(prospects, prospectorName);

  return (
    <>
      <BountyTracker prospects={prospects} />
      <DashboardKpi stats={stats} />
      <ProspectorStatsPanel stats={prospectorStats} />
    </>
  );
}
