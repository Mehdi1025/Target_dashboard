"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Ban, CalendarDays, CheckCircle2, Clock } from "lucide-react";

import { validateRDV } from "@/app/actions/rdv-actions";
import { RdvRejectDialog } from "@/components/admin/rdv-reject-dialog";
import { RdvReschedulePopover } from "@/components/admin/rdv-reschedule-popover";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  AdminCalendarRdvItem,
  AdminRdvCalendarDay,
} from "@/lib/admin-calendar-shared";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { buildProspectHref } from "@/lib/admin-navigation";
import { getRdvBadgeClass, RDV_STATUS_LABELS } from "@/lib/rdv-utils";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database.types";

export type AdminRdvCalendarViewData = {
  overdue: AdminCalendarRdvItem[];
  overdueLabel: string;
  days: AdminRdvCalendarDay[];
  totalCount: number;
  error: string | null;
};

type AdminRdvCalendarProps = {
  calendar: AdminRdvCalendarViewData;
  prospecteurs: ProfileRow[];
};

function CalendarRdvRow({
  item,
  prospecteurById,
  highlight,
  onValidate,
  onReject,
  onRescheduleSuccess,
  onRescheduleError,
  isActionPending,
}: {
  item: AdminCalendarRdvItem;
  prospecteurById: Record<string, ProfileRow>;
  highlight?: boolean;
  onValidate?: (prospectId: string) => void;
  onReject?: (prospectId: string, entreprise: string) => void;
  onRescheduleSuccess?: () => void;
  onRescheduleError?: (message: string) => void;
  isActionPending?: boolean;
}) {
  const prospecteur = item.assigned_to
    ? prospecteurById[item.assigned_to]
    : null;
  const isPendingRdv = item.rdv_status === "PENDING";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        highlight
          ? "border-sky-500/30 bg-sky-500/[0.05]"
          : "border-border/50 bg-white/60"
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-foreground">
            {format(parseISO(item.rdv_date), "HH:mm", { locale: fr })}
          </span>
          <span className="font-semibold">
            <Link
              href={buildProspectHref(item.id, "/admin")}
              className="transition-colors hover:text-amber-700 hover:underline"
            >
              {item.entreprise}
            </Link>
          </span>
          {item.ia_score !== null ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
              {item.ia_score}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {prospecteur ? getProfileDisplayName(prospecteur) : "Non assigné"} ·{" "}
          {item.email}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            getRdvBadgeClass(item.rdv_status)
          )}
        >
          {RDV_STATUS_LABELS[item.rdv_status]}
        </Badge>
        {isPendingRdv && onValidate && onReject ? (
          <>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              loading={isActionPending}
              disabled={isActionPending}
              onClick={() => onValidate(item.id)}
            >
              <CheckCircle2 className="size-3.5" />
              Valider
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isActionPending}
              onClick={() => onReject(item.id, item.entreprise)}
            >
              <Ban className="size-3.5" />
              Rejeter
            </Button>
            <RdvReschedulePopover
              prospectId={item.id}
              currentRdvDate={item.rdv_date}
              disabled={isActionPending}
              onSuccess={onRescheduleSuccess}
              onError={onRescheduleError}
            />
          </>
        ) : null}
        <Link
          href={buildProspectHref(item.id, "/admin")}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Lead
        </Link>
        <Link
          href={`/admin/prospecteurs/${item.assigned_to ?? ""}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            !item.assigned_to && "pointer-events-none opacity-40"
          )}
        >
          Prospecteur
        </Link>
      </div>
    </div>
  );
}

export function AdminRdvCalendar({ calendar, prospecteurs }: AdminRdvCalendarProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    entreprise: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prospecteurById = Object.fromEntries(prospecteurs.map((p) => [p.id, p]));
  const tomorrowKey = format(startOfDay(addDays(new Date(), 1)), "yyyy-MM-dd");

  function handleValidate(prospectId: string) {
    setPendingId(prospectId);
    setActionError(null);

    startTransition(async () => {
      const result = await validateRDV(prospectId, true);
      if (!result.ok) {
        setActionError(result.error ?? "Validation impossible.");
      } else {
        router.refresh();
      }
      setPendingId(null);
    });
  }

  function handleReject(prospectId: string, entreprise: string) {
    setActionError(null);
    setRejectTarget({ id: prospectId, entreprise });
  }

  const rowProps = {
    onValidate: handleValidate,
    onReject: handleReject,
    onRescheduleSuccess: () => router.refresh(),
    onRescheduleError: (message: string) => setActionError(message),
    isActionPending: isPending,
  };

  if (calendar.error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
        <p className="font-semibold">Erreur calendrier</p>
        <p className="mt-1 text-destructive/80">{calendar.error}</p>
      </div>
    );
  }

  if (calendar.totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-12 text-center">
        <CalendarDays className="mx-auto size-8 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aucun RDV PENDING ou VALIDATED planifié.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RdvRejectDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        prospectId={rejectTarget?.id ?? null}
        entreprise={rejectTarget?.entreprise}
        onSuccess={() => {
          setRejectTarget(null);
          router.refresh();
        }}
        onError={(message) => setActionError(message)}
      />

      {actionError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {calendar.overdue.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600" />
            <h3 className="text-sm font-bold text-rose-800">
              {calendar.overdueLabel}
            </h3>
            <Badge
              variant="outline"
              className="border-rose-500/40 bg-rose-500/10 text-rose-700"
            >
              {calendar.overdue.length}
            </Badge>
          </div>
          <p className="text-xs text-rose-700/80">
            RDV PENDING dont la date est passée — validation admin oubliée.
          </p>
          <div className="space-y-2">
            {calendar.overdue.map((item) => (
              <CalendarRdvRow
                key={item.id}
                item={item}
                prospecteurById={prospecteurById}
                {...rowProps}
                isActionPending={isPending && pendingId === item.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      {calendar.days.map((day) => (
        <section
          key={day.dayKey}
          className={cn(
            "space-y-3 rounded-2xl border p-5",
            day.dayKey === tomorrowKey
              ? "border-sky-500/25 bg-sky-500/[0.03]"
              : "border-border/60 bg-white/40"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">{day.label}</h3>
              {day.dayKey === tomorrowKey ? (
                <Badge className="bg-sky-600 text-white hover:bg-sky-600">Demain</Badge>
              ) : null}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {day.items.length} RDV
            </span>
          </div>
          <div className="space-y-2">
            {day.items.map((item) => (
              <CalendarRdvRow
                key={item.id}
                item={item}
                prospecteurById={prospecteurById}
                highlight={day.dayKey === tomorrowKey}
                {...rowProps}
                isActionPending={isPending && pendingId === item.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
