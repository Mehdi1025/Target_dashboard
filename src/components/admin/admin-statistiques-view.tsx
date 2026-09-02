"use client";

import { useMemo } from "react";

import { AdminStatisticsSection } from "@/components/admin/admin-statistics-section";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeAdminOverview, computeAdminStatistics } from "@/lib/admin-stats";

export function AdminStatistiquesView() {
  const { prospects, prospecteurs, orphans } = useAdminData();

  const overview = useMemo(
    () => computeAdminOverview(prospecteurs, prospects, orphans.length),
    [prospecteurs, prospects, orphans.length]
  );

  const statistics = useMemo(
    () => computeAdminStatistics(prospecteurs, prospects, orphans.length, overview),
    [prospecteurs, prospects, orphans.length, overview]
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

      <AdminStatisticsSection statistics={statistics} />
    </div>
  );
}
