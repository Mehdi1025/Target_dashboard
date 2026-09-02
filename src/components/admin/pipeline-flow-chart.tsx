"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Sparkles,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PipelineFlowStats, PipelineFlowStep } from "@/lib/pipeline-flow";
import { cn } from "@/lib/utils";

type PipelineFlowChartProps = {
  flow: PipelineFlowStats;
};

export function PipelineFlowChart({ flow }: PipelineFlowChartProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const maxValue = useMemo(
    () => Math.max(...flow.steps.map((step) => step.value), 1),
    [flow.steps]
  );

  const activeStep = flow.steps.find((step) => step.key === activeKey) ?? null;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-amber-500/20 bg-gradient-to-br from-slate-950 via-stone-950 to-amber-950/80 p-6 shadow-[0_0_60px_-20px_rgba(245,158,11,0.35)] lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/90">
            <GitBranch className="size-3.5" />
            Pipeline Flow
          </p>
          <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-amber-50">
            De n8n à la conversion
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-amber-100/55">
            Flux principal du CRM — largeur des nœuds proportionnelle au volume. Les
            goulets d&apos;étranglement sont surlignés.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
          <FlowKpi label="Entrées" value={String(flow.totalIngested)} />
          <FlowKpi label="Conversion globale" value={`${flow.overallConversionPct}%`} />
          <FlowKpi label="Assignés → Convertis" value={`${flow.assignToConvertPct}%`} />
        </div>
      </div>

      <div className="relative mb-6 overflow-x-auto pb-2">
        <div className="flex min-w-[880px] items-end justify-between gap-1">
          {flow.steps.map((step, index) => (
            <div key={step.key} className="flex flex-1 items-end">
              <FlowNode
                step={step}
                maxValue={maxValue}
                isActive={activeKey === step.key}
                isBottleneck={flow.bottlenecks.some(
                  (b) => b.stepKey === step.key || (step.key === "rdv_declared" && b.stepKey === "rdv_pending")
                )}
                onSelect={() =>
                  setActiveKey((current) => (current === step.key ? null : step.key))
                }
              />
              {index < flow.steps.length - 1 ? (
                <FlowConnector
                  from={step}
                  to={flow.steps[index + 1]}
                  animated={step.value > flow.steps[index + 1].value}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {activeStep ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-amber-50/90">
          <p className="font-semibold">{activeStep.label}</p>
          <p className="mt-1 text-amber-100/60">
            {activeStep.value} lead{activeStep.value > 1 ? "s" : ""} ·{" "}
            {activeStep.pctOfTotal}% du volume n8n
            {activeStep.dropFromPrev !== null && activeStep.dropFromPrev > 0
              ? ` · −${activeStep.dropFromPrev}% vs étape précédente`
              : ""}
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p className="text-sm leading-relaxed text-amber-100/85">{flow.insight}</p>
      </div>

      {flow.bottlenecks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/50">
            Goulets détectés
          </p>
          <div className="flex flex-wrap gap-2">
            {flow.bottlenecks.map((item) => (
              <Badge
                key={item.stepKey}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  item.severity === "critical" &&
                    "border-rose-500/40 bg-rose-500/15 text-rose-200",
                  item.severity === "warning" &&
                    "border-orange-500/40 bg-orange-500/15 text-orange-200",
                  item.severity === "info" &&
                    "border-amber-500/30 bg-amber-500/10 text-amber-200"
                )}
              >
                <AlertTriangle className="size-3" />
                {item.label} · {item.count}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <RdvFlowStrip flow={flow} />
    </div>
  );
}

function FlowNode({
  step,
  maxValue,
  isActive,
  isBottleneck,
  onSelect,
}: {
  step: PipelineFlowStep;
  maxValue: number;
  isActive: boolean;
  isBottleneck: boolean;
  onSelect: () => void;
}) {
  const heightPct = Math.max(28, Math.round((step.value / maxValue) * 100));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col items-center gap-2 rounded-xl border px-1 py-2 transition-all",
        isActive
          ? "border-amber-400/50 bg-white/10 ring-2 ring-amber-400/30"
          : "border-transparent hover:border-white/10 hover:bg-white/5",
        isBottleneck && !isActive && "border-rose-500/30"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-gradient-to-t shadow-lg transition-all duration-700",
          step.color,
          isBottleneck && "ring-2 ring-rose-400/50"
        )}
        style={{
          height: `${heightPct}px`,
          boxShadow: isActive ? `0 0 24px ${step.glowColor}` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] animate-pulse" />
      </div>
      <span className="font-mono text-lg font-black tabular-nums text-amber-50">
        {step.value}
      </span>
      <span className="max-w-[72px] text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-amber-200/60">
        {step.shortLabel}
      </span>
    </button>
  );
}

function FlowConnector({
  from,
  to,
  animated,
}: {
  from: PipelineFlowStep;
  to: PipelineFlowStep;
  animated: boolean;
}) {
  const drop = from.value > 0 ? Math.round(((from.value - to.value) / from.value) * 100) : 0;

  return (
    <div className="flex w-8 shrink-0 flex-col items-center justify-center gap-0.5 pb-8">
      <ArrowRight
        className={cn(
          "size-4 text-amber-200/40",
          animated && "animate-pulse text-orange-400/70"
        )}
      />
      {drop > 0 ? (
        <span className="flex items-center gap-0.5 font-mono text-[9px] text-rose-300/80">
          <TrendingDown className="size-2.5" />
          {drop}%
        </span>
      ) : null}
    </div>
  );
}

function FlowKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/45">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-black tabular-nums text-amber-50">{value}</p>
    </div>
  );
}

function RdvFlowStrip({ flow }: { flow: PipelineFlowStats }) {
  const { rdv } = flow;
  const segments = [
    { label: "Sans RDV", value: rdv.none, color: "bg-slate-500" },
    { label: "En attente", value: rdv.pending, color: "bg-orange-500" },
    { label: "Validés", value: rdv.validated, color: "bg-emerald-500" },
    { label: "Rejetés", value: rdv.rejected, color: "bg-rose-500" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-50">Sous-flux RDV (assignés)</p>
          <p className="text-xs text-amber-100/50">
            Taux validation {rdv.validationRate}% · rejet {rdv.rejectionRate}%
          </p>
        </div>
        <p className="font-mono text-xs text-amber-200/60">
          {rdv.declared} déclarés / {flow.assignedCount} assignés
        </p>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-black/40">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <div
              key={segment.label}
              className={cn("h-full transition-all duration-700", segment.color)}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-xs text-amber-100/70">
            <span className={cn("size-2 rounded-full", segment.color)} />
            {segment.label}
            <span className="font-mono font-bold text-amber-50">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
