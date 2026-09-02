"use client";

import { RdvPurgatory } from "@/app/(dashboard)/admin/components/RdvPurgatory";
import {
  AdminRdvCalendar,
  type AdminRdvCalendarViewData,
} from "@/components/admin/admin-rdv-calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileRow, ProspectListItem } from "@/types/database.types";

type RdvPurgatorySectionProps = {
  prospects: ProspectListItem[];
  prospecteurs: ProfileRow[];
  calendar: AdminRdvCalendarViewData;
  pendingTomorrowCount: number;
};

export function RdvPurgatorySection({
  prospects,
  prospecteurs,
  calendar,
  pendingTomorrowCount,
}: RdvPurgatorySectionProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="liste" className="w-full">
        <TabsList className="h-11 rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-border/40">
          <TabsTrigger
            value="liste"
            className="rounded-xl px-4 py-2 data-active:bg-orange-500 data-active:text-white data-active:shadow-md"
          >
            Vue Liste (Purgatoire)
          </TabsTrigger>
          <TabsTrigger
            value="agenda"
            className="gap-2 rounded-xl px-4 py-2 data-active:bg-sky-600 data-active:text-white data-active:shadow-md"
          >
            Vue Agenda (J-1)
            {pendingTomorrowCount > 0 ? (
              <Badge
                variant="outline"
                className="border-sky-200 bg-white/90 px-1.5 py-0 text-[10px] font-bold text-sky-700 data-active:border-white/30 data-active:bg-white/20 data-active:text-white"
              >
                {pendingTomorrowCount}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="mt-6">
          <RdvPurgatory prospects={prospects} prospecteurs={prospecteurs} />
        </TabsContent>

        <TabsContent value="agenda" className="mt-6">
          <div className="mb-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700/80">
              Agenda RDV
            </p>
            <p className="text-sm text-muted-foreground">
              PENDING et VALIDATED triés par date — section « En retard » pour les
              validations oubliées.
            </p>
          </div>
          <AdminRdvCalendar calendar={calendar} prospecteurs={prospecteurs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
