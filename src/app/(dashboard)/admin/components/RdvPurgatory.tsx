"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Ban,
  CheckCircle2,
  Clock,
  Euro,
  Flame,
  Handshake,
  XCircle,
} from "lucide-react";

import { convertDeal, validateRDV } from "@/app/actions/rdv-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/bounty-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { getRdvBadgeClass, RDV_STATUS_LABELS } from "@/lib/rdv-utils";
import { cn } from "@/lib/utils";
import type { ProfileRow, ProspectListItem, RdvStatus } from "@/types/database.types";

type RdvPurgatoryProps = {
  prospects: ProspectListItem[];
  prospecteurs: ProfileRow[];
};

function RdvStatusBadge({ status }: { status: RdvStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", getRdvBadgeClass(status))}
    >
      {RDV_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RdvPurgatory({ prospects, prospecteurs }: RdvPurgatoryProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const prospecteurById = useMemo(
    () => Object.fromEntries(prospecteurs.map((p) => [p.id, p])),
    [prospecteurs]
  );

  const pendingRdvs = useMemo(
    () => prospects.filter((p) => p.rdv_status === "PENDING"),
    [prospects]
  );

  const validatedForClosing = useMemo(
    () =>
      prospects.filter(
        (p) =>
          p.rdv_status === "VALIDATED" &&
          !p.statut.toLowerCase().includes("converti") &&
          Number(p.deal_amount ?? 0) === 0
      ),
    [prospects]
  );

  function handleValidate(prospectId: string, isApproved: boolean) {
    setPendingId(prospectId);
    setErrors((prev) => ({ ...prev, [prospectId]: "" }));

    startTransition(async () => {
      const result = await validateRDV(prospectId, isApproved);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [prospectId]: result.error ?? "Erreur." }));
      }
      setPendingId(null);
    });
  }

  function handleConvert(prospectId: string) {
    const raw = amounts[prospectId]?.trim().replace(",", ".");
    const amount = Number(raw);

    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      setErrors((prev) => ({
        ...prev,
        [prospectId]: "Saisissez un montant valide.",
      }));
      return;
    }

    setClosingId(prospectId);
    setErrors((prev) => ({ ...prev, [prospectId]: "" }));

    startTransition(async () => {
      const result = await convertDeal(prospectId, amount);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, [prospectId]: result.error ?? "Erreur." }));
      } else {
        setAmounts((prev) => ({ ...prev, [prospectId]: "" }));
      }
      setClosingId(null);
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-600/90">
              <Flame className="size-3.5" />
              Le Purgatoire
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">SAS de validation RDV</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Validez la qualité avant que le RDV ne compte pour le quota prospecteur.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-orange-500/40 bg-orange-500/10 text-orange-700"
          >
            {pendingRdvs.length} en attente
          </Badge>
        </div>

        {pendingRdvs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-10 text-center">
            <Clock className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Aucun RDV en attente — le purgatoire est vide.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-white/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-orange-500/5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Prospecteur</th>
                    <th className="px-4 py-3">Entreprise</th>
                    <th className="px-4 py-3">Date RDV</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRdvs.map((prospect) => {
                    const prospecteur = prospect.assigned_to
                      ? prospecteurById[prospect.assigned_to]
                      : null;
                    const rowPending = isPending && pendingId === prospect.id;
                    const rowError = errors[prospect.id];

                    return (
                      <tr
                        key={prospect.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-4 py-4 font-medium">
                          {prospecteur ? getProfileDisplayName(prospecteur) : "—"}
                        </td>
                        <td className="px-4 py-4">{prospect.entreprise}</td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {prospect.rdv_date
                            ? format(new Date(prospect.rdv_date), "dd MMM yyyy · HH:mm", {
                                locale: fr,
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <RdvStatusBadge status={prospect.rdv_status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-500"
                                loading={rowPending}
                                disabled={rowPending}
                                onClick={() => handleValidate(prospect.id, true)}
                              >
                                <CheckCircle2 className="size-3.5" />
                                VALIDER LE RDV
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                loading={rowPending}
                                disabled={rowPending}
                                onClick={() => handleValidate(prospect.id, false)}
                              >
                                <Ban className="size-3.5" />
                                REJETER (Hors Critères)
                              </Button>
                            </div>
                            {rowError ? (
                              <p className="text-xs text-destructive">{rowError}</p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600/90">
              <Handshake className="size-3.5" />
              Closing
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">RDVs validés à convertir</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez le montant du contrat pour calculer la commission 10%.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          >
            {validatedForClosing.length} à closer
          </Badge>
        </div>

        {validatedForClosing.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-10 text-center">
            <Euro className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Aucun RDV validé en attente de closing.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-white/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-emerald-500/5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Prospecteur</th>
                    <th className="px-4 py-3">Entreprise</th>
                    <th className="px-4 py-3">Statut RDV</th>
                    <th className="px-4 py-3">Montant deal</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedForClosing.map((prospect) => {
                    const prospecteur = prospect.assigned_to
                      ? prospecteurById[prospect.assigned_to]
                      : null;
                    const rowClosing = isPending && closingId === prospect.id;
                    const rowError = errors[prospect.id];
                    const previewAmount = Number(
                      amounts[prospect.id]?.trim().replace(",", ".") || 0
                    );
                    const previewCommission =
                      previewAmount > 0 ? previewAmount * 0.1 : 0;

                    return (
                      <tr
                        key={prospect.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-4 py-4 font-medium">
                          {prospecteur ? getProfileDisplayName(prospecteur) : "—"}
                        </td>
                        <td className="px-4 py-4">{prospect.entreprise}</td>
                        <td className="px-4 py-4">
                          <RdvStatusBadge status={prospect.rdv_status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex max-w-[180px] items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Ex: 5000"
                              value={amounts[prospect.id] ?? ""}
                              onChange={(event) =>
                                setAmounts((prev) => ({
                                  ...prev,
                                  [prospect.id]: event.target.value,
                                }))
                              }
                              disabled={rowClosing}
                              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                            />
                            <span className="shrink-0 text-xs text-muted-foreground">€</span>
                          </div>
                          {previewCommission > 0 ? (
                            <p className="mt-1 text-xs text-emerald-700">
                              Commission : {formatEuro(previewCommission)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-500"
                              loading={rowClosing}
                              disabled={rowClosing}
                              onClick={() => handleConvert(prospect.id)}
                            >
                              <CheckCircle2 className="size-3.5" />
                              MARQUER COMME CLOSÉ
                            </Button>
                            {rowError ? (
                              <p className="flex items-center gap-1 text-xs text-destructive">
                                <XCircle className="size-3" />
                                {rowError}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
