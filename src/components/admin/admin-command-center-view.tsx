"use client";

import { useEffect, useMemo, useState } from "react";

import { LiveActivityFeed } from "@/app/(dashboard)/admin/components/live-activity-feed";
import { RdvPurgatorySection } from "@/app/(dashboard)/admin/components/rdv-purgatory-section";
import {
  fetchAdminRdvCalendar,
  fetchTodayCallDispositionEvents,
} from "@/app/actions/admin-data-actions";
import { AdminKpiPanel } from "@/components/admin/admin-kpi-panel";
import { AdminDataGate } from "@/components/admin/admin-data-gate";
import { AdminPanelSkeleton } from "@/components/admin/admin-panel-skeleton";
import { OracleAdminPanel } from "@/components/admin/oracle-admin-panel";
import { OrphanLeadsTable } from "@/components/admin/orphan-leads-table";
import { ProspecteursManagementTable } from "@/components/admin/prospecteurs-management-table";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeAdminOverview } from "@/lib/admin-stats";
import { computeOracleAdmin } from "@/lib/oracle-admin";
import { countPendingRdvTomorrow } from "@/lib/admin-calendar-shared";
import type { AdminCalendarRdvItem, AdminRdvCalendarDay } from "@/lib/admin-calendar-shared";
import type { OracleCallDispositionEvent } from "@/lib/oracle-admin";

type CalendarView = {
  overdue: AdminCalendarRdvItem[];
  overdueLabel: string;
  days: AdminRdvCalendarDay[];
  items: AdminCalendarRdvItem[];
  totalCount: number;
  error: string | null;
};

export function AdminCommandCenterView() {
  const { prospects, prospecteurs, orphans, isReady, refreshKey, error: sharedError } =
    useAdminData();
  const [calendarView, setCalendarView] = useState<CalendarView>({
    overdue: [],
    overdueLabel: "",
    days: [],
    items: [],
    totalCount: 0,
    error: null,
  });
  const [todayCallDispositions, setTodayCallDispositions] = useState<
    OracleCallDispositionEvent[]
  >([]);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    setExtrasLoading(true);

    void Promise.all([fetchAdminRdvCalendar(), fetchTodayCallDispositionEvents()]).then(
      ([calendar, dispositions]) => {
        if (cancelled) return;

        setCalendarView({
          overdue: calendar.overdue,
          overdueLabel: calendar.overdueLabel,
          days: calendar.days,
          items: calendar.items,
          totalCount: calendar.totalCount,
          error: calendar.error,
        });
        setTodayCallDispositions(dispositions.events);
        setExtrasError(calendar.error ?? dispositions.error);
        setExtrasLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isReady, refreshKey]);

  const overview = useMemo(
    () => computeAdminOverview(prospecteurs, prospects, orphans.length),
    [prospecteurs, prospects, orphans.length]
  );

  const oracle = useMemo(
    () => computeOracleAdmin(prospecteurs, prospects, orphans, todayCallDispositions),
    [prospecteurs, prospects, orphans, todayCallDispositions]
  );

  const pendingTomorrowCount = useMemo(
    () => countPendingRdvTomorrow(calendarView.items),
    [calendarView.items]
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Centre de commande Admin
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Gérez votre{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              équipe commerciale.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Supervisez les prospecteurs, répartissez les leads n8n et suivez la performance de
            chaque membre — sans accéder à leur espace opérationnel.
          </p>
        </div>
      </section>

      {sharedError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-1 text-destructive/80">{sharedError}</p>
        </div>
      ) : null}

      <AdminDataGate skeletonRows={2}>
        <OracleAdminPanel snapshot={oracle} />
        <AdminKpiPanel overview={overview} />
      </AdminDataGate>

      <section id="purgatoire" className="scroll-mt-24">
        {!isReady || extrasLoading ? (
          <AdminPanelSkeleton rows={4} />
        ) : (
          <>
            {extrasError ? (
              <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
                <p className="font-semibold">Erreur calendrier RDV</p>
                <p className="mt-1 text-destructive/80">{extrasError}</p>
              </div>
            ) : null}
            <RdvPurgatorySection
              prospects={prospects}
              prospecteurs={prospecteurs}
              calendar={calendarView}
              pendingTomorrowCount={pendingTomorrowCount}
            />
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">ECG Commercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Flux temps réel des micro-actions prospecteurs
          </p>
        </div>
        {isReady ? (
          <LiveActivityFeed prospecteurs={prospecteurs} />
        ) : (
          <AdminPanelSkeleton rows={3} />
        )}
      </section>

      <AdminDataGate skeletonRows={3}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Équipe prospecteurs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Performance individuelle et accès au détail de chaque membre
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {overview.aValiderGlobal} à valider · {overview.approuvesGlobal} approuvés (global)
            </p>
          </div>
          <ProspecteursManagementTable rows={overview.prospecteurRows} />
        </section>

        <section id="orphelins" className="space-y-4 scroll-mt-24">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Distribution des leads orphelins</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leads générés par n8n sans prospecteur — assignez-les manuellement
            </p>
          </div>
          <OrphanLeadsTable />
        </section>
      </AdminDataGate>
    </div>
  );
}
