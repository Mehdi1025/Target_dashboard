"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  CalendarCheck,
  ChevronDown,
  MessageCircle,
  PhoneOff,
  XCircle,
} from "lucide-react";

import {
  cancelPendingRDV,
  updateCallDisposition,
} from "@/app/actions/rdv-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getRdvRejectionReasonLabel } from "@/lib/rdv-rejection-reasons";
import {
  EXTERNAL_RDV_DECLARE_PATCH,
  reserveRdvViaGoogleCalendar,
} from "@/lib/reserve-rdv-via-calendar";
import { canDeclareRdvFromStatus } from "@/lib/rdv-utils";
import { cn } from "@/lib/utils";
import type { CallDisposition, RdvRejectionReason, RdvStatus } from "@/types/database.types";
import { CALL_DISPOSITION_STATUTS } from "@/types/database.types";

const DISPOSITION_TOAST: Record<
  CallDisposition,
  { title: string; description: (entreprise: string) => string }
> = {
  NRP: {
    title: "NRP enregistré",
    description: (e) => `${e} — Ne répond pas.`,
  },
  ECHANGE: {
    title: "Échange en cours",
    description: (e) => `${e} — Statut mis à jour.`,
  },
  REFUS: {
    title: "Lead archivé",
    description: (e) => `${e} — Refus enregistré.`,
  },
};

export type ProspectCallPatch = {
  statut?: string;
  rdv_status?: RdvStatus;
  rdv_date?: string | null;
  rdv_rejection_reason?: RdvRejectionReason | null;
};

type ProspectCallActionsProps = {
  prospectId: string;
  entreprise: string;
  profileId?: string;
  rdvStatus: RdvStatus;
  rdvRejectionReason?: RdvRejectionReason | null;
  layout?: "inline" | "sidebar";
  onPatch?: (patch: ProspectCallPatch) => void;
};

export function ProspectCallActions({
  prospectId,
  entreprise,
  profileId,
  rdvStatus,
  rdvRejectionReason = null,
  layout = "inline",
  onPatch,
}: ProspectCallActionsProps) {
  const [localRdvStatus, setLocalRdvStatus] = useState<RdvStatus>(rdvStatus);
  const [localRejectionReason, setLocalRejectionReason] = useState<RdvRejectionReason | null>(
    rdvRejectionReason
  );
  const [isCancellingRdv, setIsCancellingRdv] = useState(false);
  const [isUpdatingDisposition, setIsUpdatingDisposition] = useState(false);
  const [isReservingRdv, setIsReservingRdv] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { toast } = useToast();

  const canDeclareRdv = canDeclareRdvFromStatus(localRdvStatus);
  const showCallQualification = localRdvStatus === "NONE" && Boolean(profileId);
  const isCallBusy = isUpdatingDisposition || isReservingRdv;
  const isSidebar = layout === "sidebar";

  useEffect(() => {
    setLocalRdvStatus(rdvStatus);
  }, [rdvStatus]);

  useEffect(() => {
    setLocalRejectionReason(rdvRejectionReason);
  }, [rdvRejectionReason]);

  async function handleReserveRdv() {
    if (!canDeclareRdv || isCallBusy) return;

    setIsReservingRdv(true);
    setActionError(null);

    try {
      const result = await reserveRdvViaGoogleCalendar(prospectId);
      if (!result.ok) {
        const message = result.error ?? "Impossible de déclarer le RDV.";
        setActionError(message);
        toast({ variant: "error", title: "Réservation impossible", description: message });
        return;
      }

      setLocalRdvStatus("PENDING");
      setLocalRejectionReason(null);
      onPatch?.(EXTERNAL_RDV_DECLARE_PATCH);
      toast({
        variant: "success",
        title: "RDV déclaré",
        description: `${entreprise} — agenda ouvert · en attente de validation admin.`,
        duration: 6000,
      });
    } catch {
      setActionError("Erreur réseau.");
      toast({
        variant: "error",
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setIsReservingRdv(false);
    }
  }

  async function handleCancelPendingRdv() {
    if (!profileId || isCancellingRdv || localRdvStatus !== "PENDING") return;

    setIsCancellingRdv(true);
    setActionError(null);

    try {
      const result = await cancelPendingRDV(prospectId, profileId);
      if (!result.ok) {
        const message = result.error ?? "Impossible d'annuler le RDV.";
        setActionError(message);
        toast({ variant: "error", title: "Annulation impossible", description: message });
        return;
      }

      setLocalRdvStatus("NONE");
      onPatch?.({ rdv_status: "NONE", rdv_date: null });
      toast({
        variant: "success",
        title: "RDV annulé",
        description: `${entreprise} — vous pouvez requalifier l'appel.`,
        duration: 5000,
      });
    } catch {
      setActionError("Erreur réseau.");
      toast({
        variant: "error",
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setIsCancellingRdv(false);
    }
  }

  async function handleCallDisposition(disposition: CallDisposition) {
    if (!profileId || isUpdatingDisposition) return;

    setIsUpdatingDisposition(true);
    setActionError(null);

    try {
      const result = await updateCallDisposition(prospectId, disposition);
      if (!result.ok) {
        const message = result.error ?? "Impossible d'enregistrer l'issue d'appel.";
        setActionError(message);
        toast({ variant: "error", title: "Qualification échouée", description: message });
        return;
      }

      const newStatut = CALL_DISPOSITION_STATUTS[disposition];
      onPatch?.({ statut: newStatut });

      const toastConfig = DISPOSITION_TOAST[disposition];
      toast({
        variant: disposition === "REFUS" ? "info" : "success",
        title: toastConfig.title,
        description: toastConfig.description(entreprise),
        duration: 5000,
      });
    } catch {
      setActionError("Erreur réseau.");
      toast({
        variant: "error",
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setIsUpdatingDisposition(false);
    }
  }

  if (!profileId) {
    return null;
  }

  const hasStatusBanner = localRdvStatus === "PENDING" || localRdvStatus === "REJECTED";

  return (
    <div className={cn("space-y-2", (isSidebar || hasStatusBanner) && "w-full")}>
      {localRdvStatus === "PENDING" ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[0.05] px-3 py-2.5",
            isSidebar && "flex-col items-stretch sm:flex-row sm:items-center"
          )}
        >
          <p className="text-xs leading-snug text-orange-800">En attente de validation admin</p>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 shrink-0 text-orange-800 hover:bg-orange-500/10 hover:text-orange-900",
              isSidebar && "w-full sm:w-auto"
            )}
            onClick={() => void handleCancelPendingRdv()}
            loading={isCancellingRdv}
            disabled={isCancellingRdv}
          >
            <XCircle className="size-3.5" />
            Annuler le RDV
          </Button>
        </div>
      ) : null}

      {localRdvStatus === "REJECTED" ? (
        <div className="space-y-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3">
          <p className="text-xs font-semibold text-rose-800">RDV rejeté par l&apos;admin</p>
          {localRejectionReason ? (
            <p className="text-sm text-rose-900">
              Motif :{" "}
              <span className="font-semibold">
                {getRdvRejectionReasonLabel(localRejectionReason)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aucun motif précisé — contactez votre responsable si besoin.
            </p>
          )}
        </div>
      ) : null}

      {showCallQualification ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isCallBusy}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5 shadow-sm shadow-primary/20",
              isUpdatingDisposition && "opacity-70",
              isSidebar && "h-10 w-full justify-start gap-3 px-3"
            )}
          >
            <PhoneOff className="size-3.5 shrink-0" />
            <span className={cn(isSidebar && "flex-1 text-left")}>Qualifier l&apos;appel</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuPositioner align={isSidebar ? "end" : "start"}>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Issue d&apos;appel</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => void handleCallDisposition("NRP")}
                  disabled={isUpdatingDisposition}
                >
                  <PhoneOff className="text-muted-foreground" />
                  NRP (Ne Répond Pas)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleCallDisposition("ECHANGE")}
                  disabled={isUpdatingDisposition}
                >
                  <MessageCircle className="text-sky-600" />
                  Échange en cours
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleCallDisposition("REFUS")}
                  disabled={isUpdatingDisposition}
                  className="text-destructive focus:text-destructive data-[highlighted]:text-destructive"
                >
                  <Archive className="text-destructive" />
                  Refus (Archive)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void handleReserveRdv()}
                  disabled={isCallBusy}
                >
                  <CalendarCheck className="text-orange-600" />
                  Réserver sur Google Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPositioner>
          </DropdownMenuPortal>
        </DropdownMenu>
      ) : null}

      {localRdvStatus === "REJECTED" && canDeclareRdv ? (
        <Button
          size="sm"
          className={cn(
            "gap-1.5 bg-orange-600 text-white shadow-sm hover:bg-orange-500",
            isSidebar && "h-10 w-full justify-start gap-3"
          )}
          onClick={() => void handleReserveRdv()}
          loading={isReservingRdv}
          disabled={isCallBusy}
        >
          <CalendarCheck className="size-3.5" />
          Re-réserver sur Google Calendar
        </Button>
      ) : null}

      {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}
    </div>
  );
}
