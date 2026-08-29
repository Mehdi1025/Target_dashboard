import { cn } from "@/lib/utils";

type ProspectScoreRingProps = {
  score: number | null;
  size?: "sm" | "lg";
  className?: string;
};

export function ProspectScoreRing({
  score,
  size = "sm",
  className,
}: ProspectScoreRingProps) {
  const dimensions = size === "lg" ? 88 : 56;
  const radius = size === "lg" ? 38 : 22;
  const stroke = size === "lg" ? 5 : 4;
  const circumference = 2 * Math.PI * radius;

  if (score === null) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-dashed border-border text-muted-foreground",
          size === "lg" ? "size-24 text-sm" : "size-14 text-xs",
          className
        )}
      >
        N/A
      </div>
    );
  }

  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75
      ? "stroke-emerald-500"
      : score >= 50
        ? "stroke-amber-500"
        : "stroke-rose-400";

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: dimensions, height: dimensions }}
    >
      <svg
        className="-rotate-90"
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        aria-hidden
      >
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted/80"
        />
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", color)}
        />
      </svg>
      <div className="absolute text-center">
        <span
          className={cn(
            "block font-mono font-bold tabular-nums leading-none",
            size === "lg" ? "text-2xl" : "text-sm"
          )}
        >
          {score}
        </span>
        {size === "lg" ? (
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            / 100
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getScoreLabel(score: number) {
  if (score >= 75) return "Lead chaud";
  if (score >= 50) return "Potentiel";
  return "À qualifier";
}

export function ProspectScoreBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null) return null;

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        score >= 75
          ? "bg-emerald-500/10 text-emerald-700"
          : score >= 50
            ? "bg-amber-500/10 text-amber-700"
            : "bg-rose-500/10 text-rose-700",
        className
      )}
    >
      {getScoreLabel(score)}
    </span>
  );
}
