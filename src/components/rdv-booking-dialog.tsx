"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, Loader2 } from "lucide-react";

import { getRdvBookableSlots, type RdvBookableSlotDto } from "@/app/actions/rdv-availability-actions";
import { declareRDV } from "@/app/actions/rdv-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RdvStatus } from "@/types/database.types";

export type RdvBookingSuccessPatch = {
  rdv_status: RdvStatus;
  rdv_date: string;
  rdv_rejection_reason: null;
};

type RdvBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectId: string;
  entreprise: string;
  onSuccess?: (patch: RdvBookingSuccessPatch) => void;
};

export function RdvBookingDialog({
  open,
  onOpenChange,
  prospectId,
  entreprise,
  onSuccess,
}: RdvBookingDialogProps) {
  const [slots, setSlots] = useState<RdvBookableSlotDto[]>([]);
  const [daysWithSlots, setDaysWithSlots] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setSelectedDay(undefined);
      setSelectedSlotIso(null);
      setLoadError(null);
      return;
    }

    setIsLoadingSlots(true);
    void getRdvBookableSlots().then((payload) => {
      setSlots(payload.slots);
      setDaysWithSlots(payload.daysWithSlots);
      setLoadError(payload.error);

      if (payload.slots.length > 0) {
        const firstDay = parseISO(`${payload.slots[0]!.dayKey}T12:00:00`);
        setSelectedDay(firstDay);
      }

      setIsLoadingSlots(false);
    });
  }, [open]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, RdvBookableSlotDto[]>();
    for (const slot of slots) {
      const list = map.get(slot.dayKey) ?? [];
      list.push(slot);
      map.set(slot.dayKey, list);
    }
    return map;
  }, [slots]);

  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const daySlots = selectedDayKey ? (slotsByDay.get(selectedDayKey) ?? []) : [];

  const disabledDays = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return !daysWithSlots.includes(key);
  };

  function handleConfirm() {
    if (!selectedSlotIso || isPending) return;

    startTransition(async () => {
      const result = await declareRDV(prospectId, selectedSlotIso);
      if (!result.ok) {
        setLoadError(result.error ?? "Réservation impossible.");
        return;
      }

      onSuccess?.({
        rdv_status: "PENDING",
        rdv_date: selectedSlotIso,
        rdv_rejection_reason: null,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-violet-500/[0.04] px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="size-5 text-primary" />
            Réserver un RDV
          </DialogTitle>
          <DialogDescription>
            Choisissez un créneau libre dans l&apos;agenda d&apos;Adam pour{" "}
            <strong>{entreprise}</strong>. Seuls les horaires où Adam est disponible sont proposés.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 md:grid-cols-[auto_1fr]">
          <div className="border-b border-border/60 p-4 md:border-b-0 md:border-r">
            {isLoadingSlots ? (
              <div className="flex h-[280px] w-[280px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Calendar
                mode="single"
                locale={fr}
                selected={selectedDay}
                onSelect={(date) => {
                  setSelectedDay(date);
                  setSelectedSlotIso(null);
                }}
                disabled={disabledDays}
                className="rounded-xl"
              />
            )}
          </div>

          <div className="flex min-h-[280px] flex-col p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Créneaux disponibles
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {selectedDay
                ? format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })
                : "Sélectionnez une date"}
            </p>

            {loadError ? (
              <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {loadError}
              </p>
            ) : null}

            {!isLoadingSlots && slots.length === 0 ? (
              <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">Aucun créneau ouvert</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Adam doit connecter son agenda Google dans Admin → Créneaux RDV.
                </p>
              </div>
            ) : null}

            {daySlots.length > 0 ? (
              <div className="mt-4 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {daySlots.map((slot) => {
                  const active = selectedSlotIso === slot.iso;
                  return (
                    <button
                      key={slot.iso}
                      type="button"
                      disabled={isPending}
                      onClick={() => setSelectedSlotIso(slot.iso)}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border-border/70 bg-white/80 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      {slot.timeLabel}
                    </button>
                  );
                })}
              </div>
            ) : selectedDay && !isLoadingSlots && slots.length > 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Aucun créneau ce jour-là — choisissez une autre date en surbrillance.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!selectedSlotIso || isPending || isLoadingSlots}
            loading={isPending}
            onClick={handleConfirm}
          >
            Confirmer le RDV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
