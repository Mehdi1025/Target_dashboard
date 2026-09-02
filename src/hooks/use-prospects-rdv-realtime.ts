"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/hooks/use-toast";
import { formatEuro } from "@/lib/bounty-stats";
import { getRdvRejectionReasonLabel } from "@/lib/rdv-rejection-reasons";
import { createClient } from "@/lib/supabase/client";
import type { ProspectListItem, RdvRejectionReason, RdvStatus } from "@/types/database.types";

type ProspectRdvPatch = Pick<
  ProspectListItem,
  | "rdv_status"
  | "rdv_date"
  | "rdv_rejection_reason"
  | "deal_amount"
  | "commission_earned"
  | "statut"
>;

type UseProspectsRdvRealtimeOptions = {
  profileId: string;
  prospects: ProspectListItem[];
  onProspectPatch: (prospectId: string, patch: ProspectRdvPatch) => void;
};

export function useProspectsRdvRealtime({
  profileId,
  prospects,
  onProspectPatch,
}: UseProspectsRdvRealtimeOptions) {
  const { toast } = useToast();
  const prospectsRef = useRef(prospects);
  const onPatchRef = useRef(onProspectPatch);

  prospectsRef.current = prospects;
  onPatchRef.current = onProspectPatch;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`prospects-rdv-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "prospects",
          filter: `assigned_to=eq.${profileId}`,
        },
        (payload) => {
          const previous = payload.old as { rdv_status?: RdvStatus; statut?: string };
          const updated = payload.new as {
            id: string;
            rdv_status?: RdvStatus;
            rdv_date?: string | null;
            rdv_rejection_reason?: RdvRejectionReason | null;
            deal_amount?: number;
            commission_earned?: number;
            statut?: string;
          };

          if (!updated.id) return;

          const known = prospectsRef.current.find((p) => p.id === updated.id);
          const entreprise = known?.entreprise ?? "Lead";
          const oldStatus = previous.rdv_status ?? known?.rdv_status ?? "NONE";
          const newStatus = updated.rdv_status ?? oldStatus;
          const oldCommission = Number(known?.commission_earned ?? 0);
          const newCommission = Number(updated.commission_earned ?? oldCommission);
          const rejectionReason =
            updated.rdv_rejection_reason ?? known?.rdv_rejection_reason ?? null;

          onPatchRef.current(updated.id, {
            rdv_status: newStatus,
            rdv_date: updated.rdv_date ?? known?.rdv_date ?? null,
            rdv_rejection_reason: rejectionReason,
            deal_amount: Number(updated.deal_amount ?? known?.deal_amount ?? 0),
            commission_earned: newCommission,
            statut: updated.statut ?? known?.statut ?? "",
          });

          if (newCommission > oldCommission) {
            toast({
              variant: "success",
              title: "Commission enregistrée",
              description: `${formatEuro(newCommission - oldCommission)} sur ${entreprise} — total ${formatEuro(newCommission)}.`,
              duration: 8000,
            });
          }

          if (oldStatus === newStatus) return;

          if (newStatus === "VALIDATED") {
            toast({
              variant: "success",
              title: "RDV validé",
              description: `${entreprise} compte pour votre quota hebdo.`,
              duration: 7000,
            });
            return;
          }

          if (newStatus === "REJECTED") {
            const reasonLabel = getRdvRejectionReasonLabel(rejectionReason);
            toast({
              variant: "warning",
              title: "RDV rejeté",
              description: reasonLabel
                ? `${entreprise} — ${reasonLabel}. Vous pouvez redéclarer après correction.`
                : `${entreprise} — hors critères qualité. Vous pouvez redéclarer après correction.`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[prospects-rdv-realtime] subscription error:", err?.message ?? err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId, toast]);
}
