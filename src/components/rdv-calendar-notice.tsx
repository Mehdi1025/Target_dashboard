"use client";

import { CalendarCheck, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  openRdvBookingUrl,
  RDV_CALENDAR_OWNER_LABEL,
  RDV_CALENDAR_OWNER_NAME,
} from "@/lib/rdv-booking-url";

export function RdvCalendarNotice() {
  return (
    <div className="border-b border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.05] to-transparent px-5 py-3 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-700">
            <CalendarCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-800/80">
              Agenda RDV
            </p>
            <p className="text-sm font-medium text-foreground">
              Les rendez-vous se prennent avec{" "}
              <span className="font-bold text-orange-900">{RDV_CALENDAR_OWNER_NAME}</span>
              <span className="text-muted-foreground"> · {RDV_CALENDAR_OWNER_LABEL}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Calendrier Google officiel — créneaux selon les disponibilités d&apos;Adam.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="shrink-0 gap-1.5 bg-orange-600 text-white shadow-sm hover:bg-orange-500 sm:self-center"
          onClick={() => openRdvBookingUrl()}
        >
          <ExternalLink className="size-3.5" />
          Ouvrir l&apos;agenda
        </Button>
      </div>
    </div>
  );
}
