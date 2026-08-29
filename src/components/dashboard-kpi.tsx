import { ArrowUpRight, CheckCircle2, Target, Users } from "lucide-react";

import type { DashboardStats } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";

type DashboardKpiProps = {
  stats: DashboardStats;
};

const KPI_CONFIG = [
  {
    key: "total" as const,
    label: "Prospects",
    sub: "Dans le pipeline",
    icon: Users,
    accent: "from-indigo-500/10 to-violet-500/5",
    iconBg: "bg-indigo-500/10 text-indigo-600",
  },
  {
    key: "aValider" as const,
    label: "À valider",
    sub: "En attente d'action",
    icon: Target,
    accent: "from-amber-500/10 to-orange-500/5",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "approuves" as const,
    label: "Approuvés",
    sub: "Prêts à contacter",
    icon: CheckCircle2,
    accent: "from-emerald-500/10 to-teal-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "scoreMoyen" as const,
    label: "Score moyen",
    sub: "Qualité IA",
    icon: ArrowUpRight,
    accent: "from-sky-500/10 to-blue-500/5",
    iconBg: "bg-sky-500/10 text-sky-600",
  },
];

function formatKpiValue(key: keyof DashboardStats, stats: DashboardStats) {
  if (key === "scoreMoyen") {
    return stats.scoreMoyen !== null ? `${stats.scoreMoyen}` : "—";
  }
  return String(stats[key]);
}

export function DashboardKpi({ stats }: DashboardKpiProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const value = formatKpiValue(kpi.key, stats);
        const suffix = kpi.key === "scoreMoyen" && stats.scoreMoyen !== null ? "/100" : "";

        return (
          <div
            key={kpi.key}
            className={cn(
              "glass-panel card-hover-lift group relative overflow-hidden rounded-2xl p-5",
              "bg-gradient-to-br",
              kpi.accent
            )}
          >
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/40 blur-2xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-start justify-between">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  kpi.iconBg
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              {kpi.key === "scoreMoyen" && stats.topScore !== null ? (
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Top {stats.topScore}
                </span>
              ) : null}
            </div>

            <div className="relative mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground">
                {value}
                {suffix ? (
                  <span className="ml-0.5 text-base font-medium text-muted-foreground">
                    {suffix}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
