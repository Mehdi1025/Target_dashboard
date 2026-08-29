import { AlertCircle, CheckCircle2, UserRound, Users } from "lucide-react";

import type { AdminOverview } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

type AdminKpiPanelProps = {
  overview: AdminOverview;
};

const KPI_CONFIG = [
  {
    key: "prospecteurs" as const,
    label: "Prospecteurs",
    sub: "Comptes actifs",
    icon: UserRound,
    accent: "from-violet-500/10 to-purple-500/5",
    iconBg: "bg-violet-500/10 text-violet-700",
  },
  {
    key: "totalProspects" as const,
    label: "Leads assignés",
    sub: "Dans les pipelines",
    icon: Users,
    accent: "from-sky-500/10 to-blue-500/5",
    iconBg: "bg-sky-500/10 text-sky-700",
  },
  {
    key: "orphanCount" as const,
    label: "Orphelins",
    sub: "En attente d'assignation",
    icon: AlertCircle,
    accent: "from-amber-500/10 to-orange-500/5",
    iconBg: "bg-amber-500/10 text-amber-700",
  },
  {
    key: "globalConversion" as const,
    label: "Conversion globale",
    sub: "Approuvés / total",
    icon: CheckCircle2,
    accent: "from-emerald-500/10 to-teal-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-700",
  },
];

function formatValue(key: (typeof KPI_CONFIG)[number]["key"], overview: AdminOverview) {
  if (key === "globalConversion") return `${overview.globalConversion}%`;
  if (key === "prospecteurs") return String(overview.totalProspecteurs);
  if (key === "orphanCount") return String(overview.orphanCount);
  return String(overview.totalProspects);
}

export function AdminKpiPanel({ overview }: AdminKpiPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const value = formatValue(kpi.key, overview);
        const isOrphanAlert = kpi.key === "orphanCount" && overview.orphanCount > 0;

        return (
          <div
            key={kpi.key}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-br p-5 shadow-sm",
              kpi.accent,
              isOrphanAlert && "ring-2 ring-amber-400/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn("flex size-10 items-center justify-center rounded-xl", kpi.iconBg)}>
                <Icon className="size-5" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
