import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpRight,
  Banknote,
  Coins,
  Crown,
  Lock,
  Sparkles,
  TrendingUp,
  Unlock,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  COMMISSION_RATE,
  formatMoney,
  formatPercentRate,
  type MoneyCommandStats,
  VOLUME_BONUS_EUR,
  WEEKLY_RDV_TARGET,
} from "@/lib/money-command";
import { cn } from "@/lib/utils";

type MoneyCommandPanelProps = {
  stats: MoneyCommandStats;
};

export function MoneyCommandPanel({ stats }: MoneyCommandPanelProps) {
  const { totals, closedDeals, prospecteurRows, weekProgress } = stats;
  const bonusDelta = totals.volumeBonusesProjectedWeek - totals.volumeBonusesWeek;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-stone-950 to-amber-950 p-8 shadow-[0_0_80px_-24px_rgba(245,158,11,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-yellow-600/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/90">
              <Coins className="size-3.5" />
              Money Command
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-amber-50 lg:text-4xl">
              Trésorerie variable
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-amber-100/60">
              Commissions closing ({formatPercentRate(COMMISSION_RATE)}), bonus volume{" "}
              {formatMoney(VOLUME_BONUS_EUR)} / prospecteur / semaine ({WEEKLY_RDV_TARGET} RDV
              validés).
            </p>
            <p className="text-xs font-medium text-amber-200/50">{weekProgress.weekLabel}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric
              label="Commissions ce mois"
              value={formatMoney(totals.commissionsMonth, true)}
              sub={`${totals.dealsClosedMonth} deal${totals.dealsClosedMonth > 1 ? "s" : ""} closé${totals.dealsClosedMonth > 1 ? "s" : ""}`}
            />
            <HeroMetric
              label="Bonus volume (semaine)"
              value={formatMoney(totals.volumeBonusesWeek)}
              sub={`${prospecteurRows.filter((r) => r.volumeBonusUnlocked).length} débloqué${prospecteurRows.filter((r) => r.volumeBonusUnlocked).length > 1 ? "s" : ""}`}
              accent="gold"
            />
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={Wallet}
            label="Paie variable semaine"
            value={formatMoney(totals.payrollWeek, true)}
            sub="Commissions + bonus actuels"
          />
          <MetricTile
            icon={TrendingUp}
            label="Projection fin de semaine"
            value={formatMoney(totals.payrollProjectedWeek, true)}
            sub={
              bonusDelta > 0
                ? `+${formatMoney(bonusDelta)} bonus potentiels`
                : "Scénario au rythme actuel"
            }
            highlight
          />
          <MetricTile
            icon={Banknote}
            label="Volume deals (mois)"
            value={formatMoney(totals.totalDealVolumeMonth, true)}
            sub="Montant contrats closés"
          />
          <MetricTile
            icon={Crown}
            label="Commissions cumulées"
            value={formatMoney(totals.commissionsAllTime, true)}
            sub="Tous prospecteurs · historique"
          />
        </div>

        <div className="relative mt-6">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-200/50">
            <span>Progression semaine</span>
            <span>
              J{weekProgress.daysElapsed}/{weekProgress.daysTotal}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.5)]"
              style={{
                width: `${Math.round((weekProgress.daysElapsed / weekProgress.daysTotal) * 100)}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
          <div className="border-b border-border/40 bg-gradient-to-r from-amber-500/[0.06] to-transparent px-6 py-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="size-4 text-amber-600" />
              Bonus volume par prospecteur
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {WEEKLY_RDV_TARGET} RDV validés = {formatMoney(VOLUME_BONUS_EUR)}
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {prospecteurRows.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                Aucun prospecteur enregistré.
              </p>
            ) : (
              prospecteurRows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {row.validatedRdvWeek}/{WEEKLY_RDV_TARGET} RDV · projection{" "}
                      {row.projectedRdvWeek}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {row.volumeBonusUnlocked ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                        <Unlock className="size-3" />
                        {formatMoney(VOLUME_BONUS_EUR)}
                      </Badge>
                    ) : row.projectedBonusWeek > 0 ? (
                      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                        <TrendingUp className="size-3" />
                        ~{formatMoney(row.projectedBonusWeek)} proj.
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Lock className="size-3" />
                        Verrouillé
                      </Badge>
                    )}
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          row.volumeBonusUnlocked
                            ? "bg-gradient-to-r from-emerald-500 to-amber-400"
                            : "bg-amber-500/70"
                        )}
                        style={{
                          width: `${Math.min(100, Math.round((row.validatedRdvWeek / WEEKLY_RDV_TARGET) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
          <div className="border-b border-border/40 bg-gradient-to-r from-emerald-500/[0.06] to-transparent px-6 py-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <ArrowUpRight className="size-4 text-emerald-600" />
              Commissions par prospecteur (mois)
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {prospecteurRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.dealsClosedMonth} closing · cumul {formatMoney(row.commissionsAllTime, true)}
                  </p>
                </div>
                <p className="font-mono text-lg font-black tabular-nums text-emerald-700">
                  {formatMoney(row.commissionsMonth, true)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-white/50">
        <div className="border-b border-border/40 bg-gradient-to-r from-amber-500/[0.05] via-transparent to-emerald-500/[0.04] px-6 py-5">
          <p className="text-sm font-bold">Deals closés ce mois</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Montant contrat + commission {formatPercentRate(COMMISSION_RATE)} calculée
          </p>
        </div>

        {closedDeals.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun deal closé ce mois-ci.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Entreprise</th>
                  <th className="px-6 py-3">Prospecteur</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Deal</th>
                  <th className="px-6 py-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.map((deal) => (
                  <tr key={deal.prospectId} className="border-b border-border/30 last:border-0">
                    <td className="px-6 py-4 font-medium">{deal.entreprise}</td>
                    <td className="px-6 py-4 text-muted-foreground">{deal.prospecteurName}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(deal.closedAt), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 font-mono tabular-nums">
                      {formatMoney(deal.dealAmount, true)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold tabular-nums text-emerald-700">
                      {formatMoney(deal.commission, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "gold";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 backdrop-blur-sm",
        accent === "gold"
          ? "border-amber-400/30 bg-amber-500/10"
          : "border-white/10 bg-white/5"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/60">{label}</p>
      <p className="mt-2 font-mono text-3xl font-black tabular-nums text-amber-50">{value}</p>
      <p className="mt-1 text-xs text-amber-100/50">{sub}</p>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 backdrop-blur-sm",
        highlight
          ? "border-yellow-400/30 bg-yellow-500/10"
          : "border-white/10 bg-black/20"
      )}
    >
      <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
        <Icon className="size-4" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/50">{label}</p>
      <p className="mt-1 font-mono text-xl font-black tabular-nums text-amber-50">{value}</p>
      <p className="mt-0.5 text-[11px] text-amber-100/45">{sub}</p>
    </div>
  );
}
