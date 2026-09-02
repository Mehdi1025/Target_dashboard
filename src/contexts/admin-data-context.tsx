"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { refreshAdminSharedData } from "@/app/actions/admin-data-actions";
import type { OrphanProspectItem, ProfileRow } from "@/types/database.types";
import type { ProspectListItem } from "@/types/prospect";

export type AdminSharedData = {
  prospects: ProspectListItem[];
  prospecteurs: ProfileRow[];
  orphans: OrphanProspectItem[];
};

type AdminDataContextValue = AdminSharedData & {
  refreshKey: number;
  bumpRefreshKey: () => void;
  refreshSharedData: () => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

type AdminDataProviderProps = AdminSharedData & {
  children: ReactNode;
};

export function AdminDataProvider({
  prospects: initialProspects,
  prospecteurs: initialProspecteurs,
  orphans: initialOrphans,
  children,
}: AdminDataProviderProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [prospecteurs, setProspecteurs] = useState(initialProspecteurs);
  const [orphans, setOrphans] = useState(initialOrphans);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setProspects(initialProspects);
    setProspecteurs(initialProspecteurs);
    setOrphans(initialOrphans);
  }, [initialProspects, initialProspecteurs, initialOrphans]);

  const bumpRefreshKey = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const refreshSharedData = useCallback(async () => {
    const data = await refreshAdminSharedData();
    if (data.error) return;

    setProspects(data.prospects);
    setProspecteurs(data.prospecteurs);
    setOrphans(data.orphans);
    setRefreshKey((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      prospects,
      prospecteurs,
      orphans,
      refreshKey,
      bumpRefreshKey,
      refreshSharedData,
    }),
    [prospects, prospecteurs, orphans, refreshKey, bumpRefreshKey, refreshSharedData]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
}
