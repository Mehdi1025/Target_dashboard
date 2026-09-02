"use client";

import { useEffect, useMemo, useState } from "react";

import { LiveActivityFeed } from "@/app/(dashboard)/admin/components/live-activity-feed";
import { RdvPurgatorySection } from "@/app/(dashboard)/admin/components/rdv-purgatory-section";
import {
  fetchAdminRdvCalendar,
  fetchTodayCallDispositionEvents,
} from "@/app/actions/admin-data-actions";
import { AdminKpiPanel } from "@/components/admin/admin-kpi-panel";
import { OracleAdminPanel } from "@/components/admin/oracle-admin-panel";
import { OrphanLeadsTable } from "@/components/admin/orphan-leads-table";
import { ProspecteursManagementTable } from "@/components/admin/prospecteurs-management-table";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeAdminOverview } from "@/lib/admin-stats";
import { computeOracleAdmin } from "@/lib/oracle-admin";
import { countPendingRdvTomorrow } from "@/lib/get-admin-calendar";
import type { AdminCalendarRdvItem, AdminRdvCalendarDay } from "@/lib/get-admin-calendar";
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
  const { prospects, prospecteurs, orphans, refreshKey } = useAdminData();
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
    let cancelled = false;

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
  }, [refreshKey]);

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

      {extrasError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement partiel</p>
          <p className="mt-1 text-destructive/80">{extrasError}</p>
        </div>
      ) : null}

      <OracleAdminPanel snapshot={oracle} />
      <AdminKpiPanel overview={overview} />

      <section id="purgatoire" className="scroll-mt-24">
        {extrasLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <RdvPurgatorySection
            prospects={prospects}
            prospecteurs={prospecteurs}
            calendar={calendarView}
            pendingTomorrowCount={pendingTomorrowCount}
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">ECG Commercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Flux temps réel des micro-actions prospecteurs
          </p>
        </div>
        <LiveActivityFeed prospecteurs={prospecteurs} />
      </section>

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
        <OrphanLeadsTable orphans={orphans} prospecteurs={prospecteurs} />
      </section>
    </div>
  );
}
