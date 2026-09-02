import {
  BarChart3,
  Flame,
  Link2,
  PieChart,
  Snowflake,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

import type { AdminStatistics } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";
import { PipelineFlowChart } from "@/components/admin/pipeline-flow-chart";

type AdminStatisticsSectionProps = {
  statistics: AdminStatistics;
};

function FunnelChart({ funnel }: { funnel: AdminStatistics["funnel"] }) {
  const max = Math.max(...funnel.map((step) => step.value), 1);

  return (
    <div className="space-y-4">
      {funnel.map((step, index) => (
        <div key={step.key} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{step.label}</span>
            <span className="font-mono font-bold tabular-nums">{step.value}</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                step.color
              )}
              style={{ width: `${Math.max((step.value / max) * 100, step.value > 0 ? 8 : 0)}%` }}
            />
          </div>
          {index < funnel.length - 1 ? (
            <div className="ml-2 h-3 w-px bg-border/60" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StatutBars({
  items,
}: {
  items: AdminStatistics["repartitionStatuts"];
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune donnée de statut disponible
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 font-mono text-muted-foreground">
              {item.count} · {item.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProspecteurRanking({
  ranking,
}: {
  ranking: AdminStatistics["prospecteurRanking"];
}) {
  if (ranking.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucun prospecteur à comparer
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ranking.map((row, index) => (
        <div
          key={row.id}
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-white/50 px-3 py-2.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 font-mono text-xs font-bold text-amber-800">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.total} leads · {row.approuves} approuvés
              {row.scoreMoyen !== null ? ` · score ${row.scoreMoyen}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="font-mono text-sm font-bold text-emerald-700">
              {row.conversion}%
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${row.conversion}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/60 p-4">
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", accent)}>
        <Icon className="size-4" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function AdminStatisticsSection({ statistics }: AdminStatisticsSectionProps) {
  return (
    <section className="space-y-8">
      <PipelineFlowChart flow={statistics.pipelineFlow} />

      <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Vue analytique</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline, qualité IA et performance équipe
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
          <BarChart3 className="size-3.5 text-amber-700" />
          <span className="text-xs font-semibold text-amber-800">
            {statistics.ajoutesSemaine} entrées cette semaine
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Funnel pipeline */}
        <div className="glass-panel rounded-[1.75rem] border border-amber-500/10 p-6 lg:col-span-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Target className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Entonnoir détaillé</h3>
              <p className="text-xs text-muted-foreground">n8n → RDV → conversion</p>
            </div>
          </div>
          <FunnelChart funnel={statistics.funnel} />
        </div>

        {/* Qualité IA */}
        <div className="glass-panel rounded-[1.75rem] border border-amber-500/10 p-6 lg:col-span-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Qualité IA</h3>
              <p className="text-xs text-muted-foreground">Scores des leads assignés</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Score moyen
              </p>
              <p className="mt-2 font-mono text-5xl font-black tabular-nums text-violet-700">
                {statistics.scoreMoyen ?? "—"}
              </p>
              {statistics.topScore !== null ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Pic à <span className="font-semibold">{statistics.topScore}/100</span>
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
              <Flame className="mx-auto size-5 text-orange-600" />
              <p className="mt-2 font-mono text-2xl font-bold">{statistics.leadsChauds}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Chauds ≥75
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
              <Snowflake className="mx-auto size-5 text-sky-600" />
              <p className="mt-2 font-mono text-2xl font-bold">{statistics.leadsFroids}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Froids &lt;50
              </p>
            </div>
          </div>
        </div>

        {/* Répartition statuts */}
        <div className="glass-panel rounded-[1.75rem] border border-amber-500/10 p-6 lg:col-span-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-700">
              <PieChart className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Répartition statuts</h3>
              <p className="text-xs text-muted-foreground">Pipeline assigné uniquement</p>
            </div>
          </div>
          <StatutBars items={statistics.repartitionStatuts} />
        </div>

        {/* Mini stats row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:col-span-12">
          <MiniStat
            icon={Users}
            label="Taux assignation"
            value={`${statistics.tauxAssignation}%`}
            sub="Leads routés vs orphelins"
            accent="bg-sky-500/10 text-sky-700"
          />
          <MiniStat
            icon={Link2}
            label="Liens client"
            value={String(statistics.avecLienClient)}
            sub="Audits partageables"
            accent="bg-indigo-500/10 text-indigo-700"
          />
          <MiniStat
            icon={BarChart3}
            label="Charge / prospecteur"
            value={String(statistics.chargeMoyenne)}
            sub="Leads en moyenne"
            accent="bg-violet-500/10 text-violet-700"
          />
          <MiniStat
            icon={TrendingUp}
            label="Entrées 30 jours"
            value={String(statistics.ajoutesMois)}
            sub={`${statistics.avecNotes} avec notes`}
            accent="bg-emerald-500/10 text-emerald-700"
          />
        </div>

        {/* Classement prospecteurs */}
        <div className="glass-panel rounded-[1.75rem] border border-amber-500/10 p-6 lg:col-span-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <Trophy className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Classement prospecteurs</h3>
              <p className="text-xs text-muted-foreground">Par taux de conversion</p>
            </div>
          </div>
          <ProspecteurRanking ranking={statistics.prospecteurRanking} />
        </div>

        {/* Top leads */}
        <div className="glass-panel rounded-[1.75rem] border border-amber-500/10 p-6 lg:col-span-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Flame className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">Top leads IA</h3>
              <p className="text-xs text-muted-foreground">Meilleurs scores du pipeline</p>
            </div>
          </div>
          {statistics.topProspects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun lead scoré pour le moment
            </p>
          ) : (
            <ol className="space-y-2">
              {statistics.topProspects.map((prospect, index) => (
                <li
                  key={prospect.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/50 px-4 py-3"
                >
                  <span className="font-mono text-lg font-black tabular-nums text-amber-600/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{prospect.entreprise}</p>
                    <p className="truncate text-xs text-muted-foreground">{prospect.statut}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-700">
                    {prospect.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
