"use client";

import { useState, useTransition } from "react";
import { fr } from "date-fns/locale";
import { CalendarClock } from "lucide-react";

import { rescheduleRDV } from "@/app/actions/rdv-actions";
import { Calendar } from "@/components/ui/calendar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type RdvReschedulePopoverProps = {
  prospectId: string;
  currentRdvDate: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function RdvReschedulePopover({
  prospectId,
  currentRdvDate,
  disabled,
  onSuccess,
  onError,
}: RdvReschedulePopoverProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentDate = new Date(currentRdvDate);

  function handleSelect(date: Date | undefined) {
    if (!date || isPending) return;

    startTransition(async () => {
      const result = await rescheduleRDV(prospectId, date.toISOString());
      if (!result.ok) {
        onError?.(result.error ?? "Impossible de reporter le RDV.");
        return;
      }

      setOpen(false);
      onSuccess?.();
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <PopoverTrigger
        disabled={disabled || isPending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <CalendarClock className="size-3.5" />
        Reporter
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          locale={fr}
          selected={currentDate}
          defaultMonth={currentDate}
          disabled={isPending}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
