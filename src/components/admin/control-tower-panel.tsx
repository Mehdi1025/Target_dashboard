import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Radio,
  ShieldAlert,
  Siren,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ControlAlert, ControlAlertSeverity, ControlTowerStats } from "@/lib/control-tower";
import { cn } from "@/lib/utils";

type ControlTowerPanelProps = {
  stats: ControlTowerStats;
};

const SEVERITY_STYLES: Record<
  ControlAlertSeverity,
  { border: string; bg: string; text: string; icon: typeof Siren }
> = {
  critical: {
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    text: "text-rose-100",
    icon: Siren,
  },
  warning: {
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    text: "text-orange-100",
    icon: AlertTriangle,
  },
  info: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-100",
    icon: Radio,
  },
};

const STATUS_STYLES = {
  operational: {
    pulse: "bg-emerald-500",
    ring: "border-emerald-500/30 bg-emerald-500/10",
    label: "text-emerald-700",
  },
  degraded: {
    pulse: "bg-orange-500",
    ring: "border-orange-500/30 bg-orange-500/10",
    label: "text-orange-700",
  },
  critical: {
    pulse: "bg-rose-500",
    ring: "border-rose-500/30 bg-rose-500/10",
    label: "text-rose-700",
  },
};

export function ControlTowerPanel({ stats }: ControlTowerPanelProps) {
  const statusStyle = STATUS_STYLES[stats.summary.status];

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border p-8 shadow-lg",
          statusStyle.ring
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
              <ShieldAlert className="size-3.5" />
              Tour de Contrôle
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
              {stats.summary.headline}
            </h2>
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span
                  className={cn(
                    "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                    statusStyle.pulse
                  )}
                />
                <span className={cn("relative inline-flex size-3 rounded-full", statusStyle.pulse)} />
              </span>
              <span className={cn("text-sm font-semibold", statusStyle.label)}>
                {stats.summary.statusLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <CountBadge label="Critiques" value={stats.summary.criticalCount} tone="rose" />
            <CountBadge label="Attention" value={stats.summary.warningCount} tone="orange" />
            <CountBadge label="Info" value={stats.summary.infoCount} tone="amber" />
          </div>
        </div>
      </section>

      {stats.alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 px-6 py-16 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <p className="mt-4 text-lg font-semibold text-emerald-800">Tour de contrôle calme</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune action urgente détectée. Consultez le centre de commande pour la routine.
          </p>
          <Link href="/admin" className={cn(buttonVariants(), "mt-6 inline-flex")}>
            Centre de commande
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {stats.alerts.map((alert, index) => (
            <AlertCard key={alert.id} alert={alert} rank={index + 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function AlertCard({ alert, rank }: { alert: ControlAlert; rank: number }) {
  const styles = SEVERITY_STYLES[alert.severity];
  const Icon = styles.icon;

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-all lg:flex-row lg:items-center lg:justify-between",
        styles.border,
        styles.bg.replace("/10", "/[0.06]"),
        alert.severity === "critical" && "ring-1 ring-rose-500/20"
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black",
            styles.bg,
            styles.text
          )}
        >
          {rank}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className={cn("size-4", styles.text.replace("text-", "text-").replace("-100", "-700"))} />
            <p className="font-semibold text-foreground">{alert.title}</p>
            {alert.count > 0 ? (
              <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-xs font-bold">
                {alert.count}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
        </div>
      </div>

      <Link
        href={alert.actionHref}
        className={cn(
          buttonVariants({
            variant: alert.severity === "critical" ? "default" : "outline",
            size: "sm",
          }),
          "shrink-0 gap-1",
          alert.severity === "critical" && "bg-rose-600 text-white hover:bg-rose-500"
        )}
      >
        {alert.actionLabel}
        <ArrowRight className="size-3.5" />
      </Link>
    </li>
  );
}

function CountBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "orange" | "amber";
}) {
  const toneClass = {
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-800",
    orange: "border-orange-500/20 bg-orange-500/5 text-orange-800",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-800",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneClass)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
