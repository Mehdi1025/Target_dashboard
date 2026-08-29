import Link from "next/link";
import {
  BarChart3,
  Flame,
  Link2,
  StickyNote,
  TrendingUp,
  Trophy,
  UserCircle,
} from "lucide-react";

import type { ProspectorStats } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";

type ProspectorStatsPanelProps = {
  stats: ProspectorStats;
};

export function ProspectorStatsPanel({ stats }: ProspectorStatsPanelProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/50 shadow-sm ring-1 ring-border/30">
      <div className="border-b border-border/30 bg-gradient-to-r from-primary/[0.04] via-transparent to-violet-500/[0.04] px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <UserCircle className="size-6" />
            </div>
            <div>
              <p className="section-eyebrow">Espace prospecteur</p>
              <h2 className="text-xl font-bold tracking-tight">
                Stats de {stats.prospectorName}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vue d&apos;ensemble de votre activité commerciale
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-white/70 px-4 py-2 text-xs font-medium text-muted-foreground">
            <BarChart3 className="size-3.5 text-primary" />
            {stats.total} lead{stats.total > 1 ? "s" : ""} au total
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border/30 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Leads chauds"
          value={String(stats.leadsChauds)}
          sub="Score ≥ 75"
          accent="text-orange-600 bg-orange-500/10"
        />
        <StatTile
          icon={TrendingUp}
          label="Taux d'approbation"
          value={`${stats.tauxApprobation}%`}
          sub={`${stats.approuves} approuvé${stats.approuves > 1 ? "s" : ""}`}
          accent="text-emerald-600 bg-emerald-500/10"
        />
        <StatTile
          icon={Link2}
          label="Liens clients"
          value={String(stats.avecLienClient)}
          sub="Audits partageables"
          accent="text-indigo-600 bg-indigo-500/10"
        />
        <StatTile
          icon={StickyNote}
          label="Notes saisies"
          value={String(stats.avecNotes)}
          sub="Comptes-rendus terrain"
          accent="text-amber-600 bg-amber-500/10"
        />
      </div>

      <div className="grid gap-px border-t border-border/30 bg-border/30 lg:grid-cols-2">
        <div className="bg-white/40 p-6 lg:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Activité récente
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <ActivityBlock label="Cette semaine" value={stats.ajoutesSemaine} />
            <ActivityBlock label="Ce mois-ci" value={stats.ajoutesMois} />
            <ActivityBlock label="À valider" value={stats.aValider} tone="amber" />
            <ActivityBlock label="Leads froids" value={stats.leadsFroids} tone="rose" />
          </div>
          {stats.scoreMoyen !== null ? (
            <p className="mt-5 text-xs text-muted-foreground">
              Score moyen pipeline :{" "}
              <span className="font-bold text-foreground">{stats.scoreMoyen}/100</span>
              {stats.topScore !== null ? (
                <> · Meilleur score : <span className="font-bold text-primary">{stats.topScore}</span></>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="bg-white/40 p-6 lg:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Répartition par statut
          </p>
          <ul className="mt-4 space-y-3">
            {stats.repartitionStatuts.length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun prospect</li>
            ) : (
              stats.repartitionStatuts.map((item) => (
                <li key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {item.count} · {item.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {stats.topProspects.length > 0 ? (
        <div className="border-t border-border/30 bg-white/30 px-6 py-5 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <p className="text-sm font-bold">Top prospects par score IA</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topProspects.map((prospect, index) => (
              <Link
                key={prospect.id}
                href={`/prospects/${prospect.id}`}
                prefetch
                className="group inline-flex items-center gap-2 rounded-xl border border-border/50 bg-white/80 px-3 py-2 text-sm shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <span className="font-mono text-xs font-bold text-primary/50">
                  #{index + 1}
                </span>
                <span className="font-semibold group-hover:text-primary">{prospect.entreprise}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {prospect.score}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bento-shine bg-white/50 p-5 lg:p-6">
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-xl", accent)}>
        <Icon className="size-4" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function ActivityBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber" | "rose";
}) {
  return (
    <div className="rounded-xl bg-white/60 p-4 ring-1 ring-border/30">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-black tabular-nums",
          tone === "amber" && "text-amber-600",
          tone === "rose" && "text-rose-500",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
