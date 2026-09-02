import { redirect } from "next/navigation";

import { MoneyCommandPanel } from "@/components/admin/money-command-panel";
import { getCurrentProfile } from "@/lib/auth";
import { computeMoneyCommand } from "@/lib/money-command";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [{ prospects, error: prospectsError }, { prospecteurs, error: prospecteursError }] =
    await Promise.all([getProspects(), getProspecteurs()]);

  const error = prospectsError ?? prospecteursError;
  const moneyStats = computeMoneyCommand(prospecteurs, prospects);

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

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <MoneyCommandPanel stats={moneyStats} />
      )}
    </div>
  );
}
