"use client";

import { useEffect, useState, useTransition } from "react";

import { validateRDV } from "@/app/actions/rdv-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RDV_REJECTION_REASONS,
  RDV_REJECTION_REASON_LABELS,
  type RdvRejectionReason,
} from "@/lib/rdv-rejection-reasons";
import { cn } from "@/lib/utils";

type RdvRejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectId: string | null;
  entreprise?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function RdvRejectDialog({
  open,
  onOpenChange,
  prospectId,
  entreprise,
  onSuccess,
  onError,
}: RdvRejectDialogProps) {
  const [selectedReason, setSelectedReason] = useState<RdvRejectionReason | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setSelectedReason(null);
      setLocalError(null);
    }
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (!next && isPending) return;
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!prospectId) return;

    if (!selectedReason) {
      setLocalError("Sélectionnez un motif de rejet.");
      return;
    }

    setLocalError(null);

    startTransition(async () => {
      const result = await validateRDV(prospectId, false, selectedReason);
      if (!result.ok) {
        const message = result.error ?? "Impossible de rejeter le RDV.";
        setLocalError(message);
        onError?.(message);
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeter le RDV</DialogTitle>
          <DialogDescription>
            {entreprise
              ? `Indiquez pourquoi le RDV de ${entreprise} est refusé. Le prospecteur verra ce motif.`
              : "Indiquez le motif de rejet. Le prospecteur verra cette information sur sa carte lead."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {RDV_REJECTION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;

            return (
              <button
                key={reason}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSelectedReason(reason);
                  setLocalError(null);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  isSelected
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-900"
                    : "border-border/70 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-full border-2",
                    isSelected ? "border-rose-600 bg-rose-600" : "border-muted-foreground/40"
                  )}
                  aria-hidden
                />
                {RDV_REJECTION_REASON_LABELS[reason]}
              </button>
            );
          })}
        </div>

        {localError ? (
          <p className="text-sm text-destructive">{localError}</p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={isPending || !selectedReason}
            onClick={handleConfirm}
          >
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
