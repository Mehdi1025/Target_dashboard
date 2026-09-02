"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  refreshKey: number;
  bumpRefreshKey: () => void;
  refreshSharedData: (options?: { silent?: boolean }) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<ProspectListItem[]>([]);
  const [prospecteurs, setProspecteurs] = useState<ProfileRow[]>([]);
  const [orphans, setOrphans] = useState<OrphanProspectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  const applyPayload = useCallback(
    (data: Awaited<ReturnType<typeof refreshAdminSharedData>>) => {
      if (data.error) {
        setError(data.error);
        return;
      }

      setProspects(data.prospects);
      setProspecteurs(data.prospecteurs);
      setOrphans(data.orphans);
      setError(null);
      setRefreshKey((value) => value + 1);
      hasLoadedRef.current = true;
    },
    []
  );

  const refreshSharedData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(!hasLoadedRef.current);
      }

      const data = await refreshAdminSharedData();
      applyPayload(data);
      setIsLoading(false);
    },
    [applyPayload]
  );

  useEffect(() => {
    void refreshSharedData();
  }, [refreshSharedData]);

  const value = useMemo(
    () => ({
      prospects,
      prospecteurs,
      orphans,
      isLoading,
      error,
      isReady: !isLoading && !error && hasLoadedRef.current,
      refreshKey,
      bumpRefreshKey: () => setRefreshKey((value) => value + 1),
      refreshSharedData,
    }),
    [
      prospects,
      prospecteurs,
      orphans,
      isLoading,
      error,
      refreshKey,
      refreshSharedData,
    ]
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
