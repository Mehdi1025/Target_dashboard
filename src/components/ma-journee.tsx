"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";

import { computeMaJournee, type MaJourneeItem } from "@/lib/ma-journee";
import { cn } from "@/lib/utils";
import type { ProspectListItem } from "@/types/prospect";

type MaJourneeProps = {
  prospects: ProspectListItem[];
};

const COLUMN_CONFIG = [
  {
    key: "aValider" as const,
    totalKey: "aValider" as const,
    label: "À valider",
    sub: "Priorité score IA",
    icon: Target,
    accent: "border-amber-500/25 bg-amber-500/[0.04]",
    iconClass: "text-amber-600 bg-amber-500/10",
    empty: "Aucun lead à valider",
  },
  {
    key: "rdvEnAttente" as const,
    totalKey: "rdvEnAttente" as const,
    label: "RDV en attente",
    sub: "Validation admin",
    icon: CalendarClock,
    accent: "border-orange-500/25 bg-orange-500/[0.04]",
    iconClass: "text-orange-600 bg-orange-500/10",
    empty: "Aucun RDV en cours de validation",
  },
  {
    key: "approuvesSansRdv" as const,
    totalKey: "approuvesSansRdv" as const,
    label: "Sans RDV",
    sub: "Approuvés à booker · relances",
    icon: Flame,
    accent: "border-emerald-500/25 bg-emerald-500/[0.04]",
    iconClass: "text-emerald-600 bg-emerald-500/10",
    empty: "Tous les approuvés ont un RDV",
  },
];

function CallDispositionBadge({
  disposition,
}: {
  disposition: MaJourneeItem["callDisposition"];
}) {
  if (!disposition) return null;

  const config =
    disposition === "NRP"
      ? {
          label: "NRP · À relancer",
          className: "border-orange-500/35 bg-orange-500/12 text-orange-700",
          dotClass: "bg-orange-500",
        }
      : {
          label: "Échange · À relancer",
          className: "border-sky-500/35 bg-sky-500/12 text-sky-700",
          dotClass: "bg-sky-500",
        };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        config.className
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}

function MaJourneeRow({
  item,
  showFollowUpBadge,
}: {
  item: MaJourneeItem;
  showFollowUpBadge?: boolean;
}) {
  return (
    <Link
      href={`/prospects/${item.id}`}
      prefetch
      className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-white/70 px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:text-primary">
          {item.entreprise}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <p className="truncate text-[11px] text-muted-foreground">{item.statut}</p>
          {showFollowUpBadge ? (
            <CallDispositionBadge disposition={item.callDisposition} />
          ) : null}
        </div>
      </div>
      {item.ia_score !== null ? (
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
          {item.ia_score}
        </span>
      ) : null}
    </Link>
  );
}

export function MaJournee({ prospects }: MaJourneeProps) {
  const stats = computeMaJournee(prospects);
  const todayLabel = format(new Date(), "EEEE d MMMM", { locale: fr });
  const allClear =
    stats.totals.aValider === 0 &&
    stats.totals.rdvEnAttente === 0 &&
    stats.totals.approuvesSansRdv === 0 &&
    stats.totals.rdvRejetes === 0;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-white/50 shadow-sm ring-1 ring-border/30">
      <div className="border-b border-border/40 bg-gradient-to-r from-primary/[0.05] via-transparent to-violet-500/[0.04] px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
              <Sparkles className="size-3.5" />
              Ma journée
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight capitalize">{todayLabel}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Vos priorités commerciales du moment
            </p>
          </div>
          {allClear ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              Tout est à jour
            </div>
          ) : null}
        </div>
      </div>

      {stats.totals.rdvRejetes > 0 ? (
        <div className="border-b border-rose-500/20 bg-rose-500/[0.06] px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-semibold text-rose-800">
                {stats.totals.rdvRejetes} RDV rejeté
                {stats.totals.rdvRejetes > 1 ? "s" : ""} — hors critères qualité
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.rdvRejetes.map((item) => (
                  <Link
                    key={item.id}
                    href={`/prospects/${item.id}`}
                    prefetch
                    className="rounded-full border border-rose-500/30 bg-white/80 px-3 py-1 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-50"
                  >
                    {item.entreprise}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-px bg-border/30 lg:grid-cols-3">
        {COLUMN_CONFIG.map((column) => {
          const Icon = column.icon;
          const items = stats[column.key];
          const total = stats.totals[column.totalKey];

          return (
            <div key={column.key} className={cn("bg-white/40 p-5 lg:p-6", column.accent)}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      column.iconClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{column.label}</p>
                    <p className="text-[11px] text-muted-foreground">{column.sub}</p>
                  </div>
                </div>
                <span className="font-mono text-2xl font-black tabular-nums">{total}</span>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                    {column.empty}
                  </p>
                ) : (
                  items.map((item) => (
                    <MaJourneeRow
                      key={item.id}
                      item={item}
                      showFollowUpBadge={column.key === "approuvesSansRdv"}
                    />
                  ))
                )}
              </div>

              {total > items.length ? (
                <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
                  +{total - items.length} autre{total - items.length > 1 ? "s" : ""} dans le pipeline
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
