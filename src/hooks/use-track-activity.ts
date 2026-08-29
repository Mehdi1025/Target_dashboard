"use client";

import { useCallback, useRef, useTransition } from "react";

import { trackActivity } from "@/app/actions/track-activity";
import type { ActivityMetadata } from "@/types/activity.types";
import type { ActionType } from "@/types/database.types";

type LogActionOptions = {
  /** Évite les doublons rapides pour la même action sur le même prospect */
  dedupeMs?: number;
};

export function useTrackActivity() {
  const [isPending, startTransition] = useTransition();
  const recentKeysRef = useRef<Map<string, number>>(new Map());

  const logAction = useCallback(
    (
      actionType: ActionType,
      prospectId?: string,
      metadata?: ActivityMetadata,
      options?: LogActionOptions
    ) => {
      const dedupeMs = options?.dedupeMs ?? 0;
      const dedupeKey = `${actionType}:${prospectId ?? "global"}`;

      if (dedupeMs > 0) {
        const now = Date.now();
        const lastLoggedAt = recentKeysRef.current.get(dedupeKey);

        if (lastLoggedAt && now - lastLoggedAt < dedupeMs) {
          return;
        }

        recentKeysRef.current.set(dedupeKey, now);
      }

      startTransition(() => {
        void trackActivity(actionType, prospectId, metadata);
      });
    },
    []
  );

  return { logAction, isPending };
}
