"use client";

import { Lock, Sparkles, Target, TrendingUp, Unlock } from "lucide-react";

import {
  computeBountyStats,
  formatEuro,
  VOLUME_BONUS_EUR,
  WEEKLY_RDV_TARGET,
} from "@/lib/bounty-stats";
import { cn } from "@/lib/utils";
import type { ProspectListItem } from "@/types/prospect";

type BountyTrackerProps = {
  prospects: ProspectListItem[];
};

export function BountyTracker({ prospects }: BountyTrackerProps) {
  const stats = computeBountyStats(prospects);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              <Target className="size-3.5" />
              Bounty Tracker
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              Quota & Primes
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Seuls les RDV validés par l&apos;admin comptent cette semaine.
            </p>
          </div>
          {stats.pendingCount > 0 && (
            <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
              {stats.pendingCount} en attente
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm font-medium text-slate-300">
              Objectif Semaine :{" "}
              <span className="font-mono text-lg font-bold text-cyan-300">
                {stats.validatedThisWeek}
              </span>
              <span className="text-slate-500"> / {WEEKLY_RDV_TARGET} RDVs Validés</span>
            </p>
            <span className="font-mono text-xs text-cyan-400/80">{stats.progressPct}%</span>
          </div>

          <div className="relative h-4 overflow-hidden rounded-full border border-cyan-500/30 bg-slate-800/80">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                stats.volumeBonusUnlocked
                  ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_16px_rgba(34,211,238,0.45)]"
              )}
              style={{ width: `${stats.progressPct}%` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] animate-pulse" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className={cn(
              "rounded-xl border p-4 backdrop-blur-sm transition-colors",
              stats.volumeBonusUnlocked
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-slate-700/80 bg-slate-900/60"
            )}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {stats.volumeBonusUnlocked ? (
                <Unlock className="size-3.5 text-emerald-400" />
              ) : (
                <Lock className="size-3.5 text-slate-500" />
              )}
              Bonus Volume
            </div>
            <p
              className={cn(
                "mt-2 text-2xl font-extrabold tabular-nums",
                stats.volumeBonusUnlocked ? "text-emerald-300" : "text-slate-500"
              )}
            >
              {stats.volumeBonusUnlocked ? formatEuro(VOLUME_BONUS_EUR) : "Verrouillé"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.volumeBonusUnlocked
                ? "15 RDV validés — prime débloquée !"
                : `${WEEKLY_RDV_TARGET - stats.validatedThisWeek} RDV restants pour ${formatEuro(VOLUME_BONUS_EUR)}`}
            </p>
          </div>

          <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/80">
              <TrendingUp className="size-3.5" />
              Commissions Closing
            </div>
            <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold tabular-nums text-fuchsia-200">
              <Sparkles className="size-5 text-fuchsia-400/80" />
              {formatEuro(stats.totalCommissions)}
            </p>
            <p className="mt-1 text-xs text-slate-500">10% sur chaque deal converti</p>
          </div>
        </div>
      </div>
    </section>
  );
}
