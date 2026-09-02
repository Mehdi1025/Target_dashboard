"use client";

import { useMemo } from "react";

import { MoneyCommandPanel } from "@/components/admin/money-command-panel";
import { AdminDataGate } from "@/components/admin/admin-data-gate";
import { useAdminData } from "@/contexts/admin-data-context";
import { computeMoneyCommand } from "@/lib/money-command";

export function AdminFinanceView() {
  const { prospects, prospecteurs } = useAdminData();

  const moneyStats = useMemo(
    () => computeMoneyCommand(prospecteurs, prospects),
    [prospecteurs, prospects]
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Finance Admin
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Money Command,{" "}
            <span className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
              trésorerie primes.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Commissions closing, bonus volume hebdo et projection de paie variable — vue
            consolidée par prospecteur.
          </p>
        </div>
      </section>

      <AdminDataGate skeletonRows={4}>
        <MoneyCommandPanel stats={moneyStats} />
      </AdminDataGate>
    </div>
  );
}
