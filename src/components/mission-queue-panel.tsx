"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Copy,
  ExternalLink,
  Phone,
  RotateCcw,
  Target,
  Zap,
} from "lucide-react";

import { declareRDV } from "@/app/actions/rdv-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProspectsRdvRealtime } from "@/hooks/use-prospects-rdv-realtime";
import { useToast } from "@/hooks/use-toast";
import { computeMissionQueue, type MissionItem } from "@/lib/mission-queue";
import { cn } from "@/lib/utils";
import type { ProspectListItem } from "@/types/prospect";

type MissionQueuePanelProps = {
  initialProspects: ProspectListItem[];
  profileId: string;
};

const ACTION_ICONS = {
  qualify_call: Phone,
  declare_rdv: CalendarCheck,
  redo_rdv: RotateCcw,
  follow_up_closing: ExternalLink,
  open_lead: ExternalLink,
} as const;

export function MissionQueuePanel({
  initialProspects,
  profileId,
}: MissionQueuePanelProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  const handleProspectPatch = useCallback(
    (prospectId: string, patch: Partial<ProspectListItem>) => {
      setProspects((current) =>
        current.map((prospect) =>
          prospect.id === prospectId ? { ...prospect, ...patch } : prospect
        )
      );
    },
    []
  );

  useProspectsRdvRealtime({
    profileId,
    prospects,
    onProspectPatch: handleProspectPatch,
  });

  const queue = useMemo(() => computeMissionQueue(prospects), [prospects]);

  function runMissionAction(item: MissionItem) {
    setPendingId(item.id);

    startTransition(async () => {
      try {
        if (item.actionType === "qualify_call") {
          window.location.href = "/";
          return;
        }

        if (item.actionType === "declare_rdv" || item.actionType === "redo_rdv") {
          const result = await declareRDV(item.prospectId);
          if (!result.ok) throw new Error(result.error ?? "Échec RDV");

          handleProspectPatch(item.prospectId, {
            rdv_status: "PENDING",
            rdv_date: new Date().toISOString(),
          });
          toast({
            variant: "success",
            title: item.actionType === "redo_rdv" ? "RDV re-déclaré" : "RDV déclaré",
            description: `${item.entreprise} — en attente de validation admin.`,
          });
        }

        if (item.actionType === "follow_up_closing" || item.actionType === "open_lead") {
          window.location.href = `/prospects/${item.prospectId}`;
          return;
        }
      } catch (error) {
        toast({
          variant: "error",
          title: "Action impossible",
          description:
            error instanceof Error ? error.message : "Une erreur est survenue.",
        });
      } finally {
        setPendingId(null);
      }
    });
  }

  async function copyEmail(item: MissionItem) {
    try {
      await navigator.clipboard.writeText(item.email);
      toast({
        variant: "success",
        title: "Email copié",
        description: item.email,
      });
    } catch {
      toast({
        variant: "error",
        title: "Copie impossible",
        description: "Autorisez l'accès au presse-papiers.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-[0_0_60px_-20px_rgba(99,102,241,0.45)]">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
              <Zap className="size-3.5" />
              Mission Queue
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
              {queue.summary.headline}
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">{queue.summary.subline}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              RDV semaine
            </p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-indigo-200">
              {queue.summary.validatedThisWeek}
              <span className="text-lg text-slate-500">/{queue.summary.weeklyTarget}</span>
            </p>
            {queue.summary.rdvRemaining > 0 ? (
              <p className="mt-1 text-xs text-amber-300">
                {queue.summary.rdvRemaining} restant{queue.summary.rdvRemaining > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-emerald-300">Objectif atteint</p>
            )}
          </div>
        </div>
      </section>

      {queue.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-16 text-center">
          <Target className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">Aucune mission prioritaire</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenez plus tard ou parcourez le pipeline pour de nouvelles opportunités.
          </p>
          <Link href="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
            Ouvrir le pipeline
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {queue.items.map((item, index) => {
            const Icon = ACTION_ICONS[item.actionType];
            const rowPending = isPending && pendingId === item.id;
            const isPassive = item.actionType === "open_lead";

            return (
              <li
                key={item.id}
                className={cn(
                  "group rounded-2xl border bg-white/60 p-5 shadow-sm transition-all hover:border-primary/25 hover:bg-white hover:shadow-md",
                  index === 0 && "border-primary/30 ring-2 ring-primary/10",
                  isPassive && "opacity-90"
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-black text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <p className="font-semibold text-foreground">{item.title}</p>
                        {item.ia_score !== null ? (
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {item.ia_score}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyEmail(item)}
                      disabled={rowPending}
                    >
                      <Copy className="size-3.5" />
                      Email
                    </Button>
                    <Link
                      href={`/prospecteur/briefing?id=${item.prospectId}`}
                      prefetch
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <BookOpen className="size-3.5" />
                      Briefing
                    </Link>
                    <Link
                      href={`/prospects/${item.prospectId}`}
                      prefetch
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
                    >
                      Fiche
                      <ArrowRight className="size-3.5" />
                    </Link>
                    <Button
                      size="sm"
                      className="min-w-[140px] shadow-sm shadow-primary/20"
                      loading={rowPending}
                      disabled={rowPending || isPassive}
                      variant={isPassive ? "secondary" : "default"}
                      onClick={() => runMissionAction(item)}
                    >
                      {item.ctaLabel}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
