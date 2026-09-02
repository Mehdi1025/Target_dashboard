"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  Crosshair,
  Radio,
  Target,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { TeamPulseMember, TeamPulseSnapshot, TeamPulseStatus } from "@/lib/team-pulse";
import { getActionLabel } from "@/types/activity.types";
import type { ProspectActivityLogRow } from "@/types/activity.types";
import { cn } from "@/lib/utils";

type TeamPulsePanelProps = {
  initialSnapshot: TeamPulseSnapshot;
};

const STATUS_STYLES: Record<
  TeamPulseStatus,
  { ring: string; badge: string; dot: string; glow: string }
> = {
  hunting: {
    ring: "border-emerald-500/40",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    dot: "bg-emerald-500",
    glow: "shadow-[0_0_40px_-8px_rgba(16,185,129,0.5)]",
  },
  quota_risk: {
    ring: "border-orange-500/40",
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-700",
    dot: "bg-orange-500",
    glow: "shadow-[0_0_40px_-8px_rgba(249,115,22,0.45)]",
  },
  idle: {
    ring: "border-sky-500/25",
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-700",
    dot: "bg-sky-400",
    glow: "",
  },
  inactive: {
    ring: "border-zinc-400/30",
    badge: "border-zinc-400/30 bg-zinc-500/10 text-zinc-600",
    dot: "bg-zinc-400",
    glow: "",
  },
};

function statusSortRank(status: TeamPulseStatus): number {
  return { hunting: 0, quota_risk: 1, idle: 2, inactive: 3 }[status];
}

function sortMembers(members: TeamPulseMember[]): TeamPulseMember[] {
  return [...members].sort((a, b) => {
    const rankDiff = statusSortRank(a.status) - statusSortRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    if (a.lastActivityAt && b.lastActivityAt) {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    }
    return b.rdvValidatedWeek - a.rdvValidatedWeek;
  });
}

function resolveStatusFromActivity(
  member: TeamPulseMember,
  lastActivityAt: string
): Pick<TeamPulseMember, "status" | "statusLabel"> {
  if (member.status === "quota_risk") {
    return { status: "quota_risk", statusLabel: "En retard quota" };
  }
  const minutesSince =
    (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60);
  if (minutesSince <= 30) {
    return { status: "hunting", statusLabel: "En chasse" };
  }
  return { status: "idle", statusLabel: "En veille" };
}

export function TeamPulsePanel({ initialSnapshot }: TeamPulsePanelProps) {
  const [members, setMembers] = useState(initialSnapshot.members);
  const [summary, setSummary] = useState(initialSnapshot.summary);
  const [isLive, setIsLive] = useState(false);
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());

  const recomputeSummary = useCallback((nextMembers: TeamPulseMember[]) => {
    setSummary({
      totalMembers: nextMembers.length,
      huntingCount: nextMembers.filter((m) => m.status === "hunting").length,
      inactiveCount: nextMembers.filter((m) => m.status === "inactive").length,
      quotaRiskCount: nextMembers.filter((m) => m.status === "quota_risk").length,
      avgRdvProgressPct:
        nextMembers.length > 0
          ? Math.round(
              nextMembers.reduce((sum, m) => sum + m.rdvProgressPct, 0) / nextMembers.length
            )
          : 0,
      teamValidatedWeek: nextMembers.reduce((sum, m) => sum + m.rdvValidatedWeek, 0),
      teamWeeklyTarget: nextMembers.length * 15,
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const channel = supabase
      .channel("team-pulse-ecg")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prospector_logs" },
        (payload) => {
          if (!isMounted) return;

          const row = payload.new as ProspectActivityLogRow;
          const metadata = row.metadata ?? {};

          setMembers((current) => {
            const index = current.findIndex((m) => m.id === row.profile_id);
            if (index === -1) return current;

            const member = current[index];
            const statusUpdate = resolveStatusFromActivity(member, row.created_at);
            const updated: TeamPulseMember = {
              ...member,
              ...statusUpdate,
              lastActivityAt: row.created_at,
              lastActionType: row.action_type,
              lastActionLabel: getActionLabel(row.action_type),
              lastEntreprise:
                typeof metadata.entreprise === "string" ? metadata.entreprise : member.lastEntreprise,
            };

            const next = [...current];
            next[index] = updated;
            const sorted = sortMembers(next);
            recomputeSummary(sorted);
            return sorted;
          });

          setPulsingIds((current) => new Set(current).add(row.profile_id));
          window.setTimeout(() => {
            setPulsingIds((current) => {
              const next = new Set(current);
              next.delete(row.profile_id);
              return next;
            });
          }, 2800);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsLive(true);
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [recomputeSummary]);

  const teamProgressPct = useMemo(() => {
    if (summary.teamWeeklyTarget === 0) return 0;
    return Math.min(
      100,
      Math.round((summary.teamValidatedWeek / summary.teamWeeklyTarget) * 100)
    );
  }, [summary.teamValidatedWeek, summary.teamWeeklyTarget]);

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-500/25 bg-violet-500/[0.03] px-6 py-16 text-center">
        <UserRound className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Aucun prospecteur inscrit
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Créez des comptes prospecteur dans Supabase Auth pour activer le Team Pulse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-violet-500/25 bg-gradient-to-br from-zinc-950 via-violet-950/40 to-zinc-950 p-6 shadow-[0_0_60px_-20px_rgba(139,92,246,0.35)] lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 size-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              <Activity className="size-3.5" />
              Team Pulse
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
              Qui travaille vraiment ?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-violet-100/55">
              Activité ECG en direct, quotas RDV et qualité — supervisez l&apos;équipe sans lire
              les logs.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5">
            <span className="relative flex size-2">
              {isLive ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </>
              ) : (
                <span className="relative inline-flex size-2 rounded-full bg-zinc-600" />
              )}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {isLive ? "Live ECG" : "Sync…"}
            </span>
            <Radio className="size-3.5 text-zinc-500" />
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="En chasse" value={summary.huntingCount} accent="emerald" />
          <SummaryTile label="Retard quota" value={summary.quotaRiskCount} accent="orange" />
          <SummaryTile label="Inactifs" value={summary.inactiveCount} accent="zinc" />
          <SummaryTile
            label="RDV équipe"
            value={`${summary.teamValidatedWeek}/${summary.teamWeeklyTarget}`}
            sub={`${teamProgressPct}% objectif`}
            accent="violet"
          />
        </div>

        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${teamProgressPct}%` }}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <PulseCard
            key={member.id}
            member={member}
            isPulsing={pulsingIds.has(member.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: "emerald" | "orange" | "zinc" | "violet";
}) {
  const accents = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    orange: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    zinc: "border-zinc-500/25 bg-zinc-500/10 text-zinc-300",
    violet: "border-violet-500/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3", accents[accent])}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
      {sub ? <p className="mt-0.5 text-xs opacity-60">{sub}</p> : null}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "emerald" | "rose" | "sky";
}) {
  const tones = {
    emerald: "text-emerald-700",
    rose: "text-rose-600",
    sky: "text-sky-700",
  };

  return (
    <div className="rounded-lg bg-muted/40 px-2 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("font-mono text-sm font-bold", tones[tone])}>{value}</p>
    </div>
  );
}

function PulseCard({
  member,
  isPulsing,
}: {
  member: TeamPulseMember;
  isPulsing: boolean;
}) {
  const styles = STATUS_STYLES[member.status];
  const lastActivityLabel = member.lastActivityAt
    ? formatDistanceToNow(new Date(member.lastActivityAt), { addSuffix: true, locale: fr })
    : "Jamais";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white/70 p-5 shadow-sm transition-all duration-500",
        styles.ring,
        isPulsing && cn("border-emerald-500/50 bg-emerald-500/[0.04]", styles.glow)
      )}
    >
      {isPulsing ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent" />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-lg font-bold text-violet-700">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white",
                styles.dot,
                member.status === "hunting" && "animate-pulse"
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold tracking-tight">{member.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 text-[10px]", styles.badge)}>
          {member.statusLabel}
        </Badge>
      </div>

      <div className="relative mt-4 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Dernière action
        </p>
        <p className="mt-1 text-sm font-medium">
          {member.lastActionLabel ?? "Aucune activité ECG"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {member.lastEntreprise ? (
            <span className="font-medium text-foreground/80">{member.lastEntreprise}</span>
          ) : null}
          <span>{lastActivityLabel}</span>
        </div>
      </div>

      <div className="relative mt-4 space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <Target className="size-3" />
              RDV semaine
            </span>
            <span className="font-mono font-bold">
              {member.rdvValidatedWeek}/{member.rdvWeeklyTarget}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                member.volumeBonusUnlocked ? "bg-emerald-500" : "bg-violet-500"
              )}
              style={{ width: `${member.rdvProgressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Validés" value={member.rdvValidatedTotal} tone="emerald" />
          <MiniStat label="Rejetés" value={member.rdvRejected} tone="rose" />
          <MiniStat
            label="Qualité"
            value={member.rdvQualityPct !== null ? `${member.rdvQualityPct}%` : "—"}
            tone="sky"
          />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Crosshair className="size-3" />
            {member.assignedCount} leads
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3" />
            {member.tauxApprobation}%
          </span>
          {member.rdvPending > 0 ? (
            <span className="flex items-center gap-1 text-amber-600">
              <Zap className="size-3" />
              {member.rdvPending} RDV
            </span>
          ) : null}
        </div>
        <Link
          href={`/admin/prospecteurs/${member.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 shrink-0")}
        >
          Fiche
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </article>
  );
}
