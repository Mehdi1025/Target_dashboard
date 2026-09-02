import Link from "next/link";
import { ArrowRight, BrainCircuit, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { OracleAdminSnapshot, OracleInsightSeverity } from "@/lib/oracle-admin";
import { cn } from "@/lib/utils";

type OracleAdminPanelProps = {
  snapshot: OracleAdminSnapshot;
};

const SEVERITY_STYLES: Record<
  OracleInsightSeverity,
  { border: string; dot: string; text: string }
> = {
  critical: {
    border: "border-rose-500/30 bg-rose-500/[0.06]",
    dot: "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)]",
    text: "text-rose-100/90",
  },
  warning: {
    border: "border-amber-500/30 bg-amber-500/[0.06]",
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]",
    text: "text-amber-50/90",
  },
  opportunity: {
    border: "border-violet-500/25 bg-violet-500/[0.06]",
    dot: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.5)]",
    text: "text-violet-100/90",
  },
  positive: {
    border: "border-emerald-500/25 bg-emerald-500/[0.06]",
    dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]",
    text: "text-emerald-50/90",
  },
};

export function OracleAdminPanel({ snapshot }: OracleAdminPanelProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-800/90 bg-[#070708] text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.05]">
      <div className="relative overflow-hidden border-b border-white/[0.08] px-6 py-5 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-8 top-0 size-32 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
              <BrainCircuit className="size-5 text-violet-300" strokeWidth={2.2} />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/90">
                <Sparkles className="size-3" />
                Oracle Admin
              </p>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Insights automatiques
              </h2>
              <p className="text-xs text-zinc-500">
                Recommandations générées depuis vos données CRM — sans LLM.
              </p>
            </div>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            {snapshot.insights.length} signal{snapshot.insights.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-white/[0.06]">
        {snapshot.insights.map((insight) => {
          const styles = SEVERITY_STYLES[insight.severity];

          return (
            <li
              key={insight.id}
              className={cn(
                "flex flex-col gap-4 px-6 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between lg:px-8",
                styles.border
              )}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", styles.dot)} />
                <p className={cn("text-sm leading-relaxed", styles.text)}>
                  « {insight.message} »
                </p>
              </div>

              {insight.actionLabel && insight.actionHref ? (
                <Link
                  href={insight.actionHref}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "shrink-0 gap-1.5 border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {insight.actionLabel}
                  <ArrowRight className="size-3.5" />
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
