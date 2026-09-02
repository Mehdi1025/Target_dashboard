"use client";

import type { ReactNode } from "react";

import { AdminPanelSkeleton } from "@/components/admin/admin-panel-skeleton";
import { useAdminData } from "@/contexts/admin-data-context";

type AdminDataGateProps = {
  children: ReactNode;
  skeletonRows?: number;
};

/** Affiche un skeleton pendant le chargement des données admin partagées. */
export function AdminDataGate({ children, skeletonRows = 3 }: AdminDataGateProps) {
  const { isLoading, error, isReady } = useAdminData();

  if (error && !isReady) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
        <p className="font-semibold">Erreur de chargement</p>
        <p className="mt-1 text-destructive/80">{error}</p>
      </div>
    );
  }

  if (isLoading && !isReady) {
    return <AdminPanelSkeleton rows={skeletonRows} />;
  }

  return <>{children}</>;
}
