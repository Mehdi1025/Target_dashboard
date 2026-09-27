"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, UserPlus, Users } from "lucide-react";

import { assignProspectAction, assignProspectsBulkAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAdminData } from "@/contexts/admin-data-context";
import { useToast } from "@/hooks/use-toast";
import { buildProspectHref } from "@/lib/admin-navigation";
import { getProspectCountryBadge } from "@/lib/prospect-country";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { cn } from "@/lib/utils";

const BACK_FROM = "/admin";

export function OrphanLeadsTable() {
  const { orphans, prospecteurs, markOrphanAssigned, markOrphansAssignedBulk } = useAdminData();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [bulkProspecteurId, setBulkProspecteurId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const orphanIds = useMemo(() => orphans.map((orphan) => orphan.id), [orphans]);
  const selectedCount = checkedIds.size;
  const allSelected = orphans.length > 0 && selectedCount === orphans.length;
  const someSelected = selectedCount > 0 && !allSelected;

  if (orphans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-emerald-700">
          Aucun lead orphelin — tout est assigné.
        </p>
      </div>
    );
  }

  function toggleOne(prospectId: string, checked: boolean) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(prospectId);
      } else {
        next.delete(prospectId);
      }
      return next;
    });
    setBulkError(null);
  }

  function toggleAll(checked: boolean) {
    setCheckedIds(checked ? new Set(orphanIds) : new Set());
    setBulkError(null);
  }

  function handleAssign(prospectId: string) {
    const prospecteurId = selections[prospectId];
    if (!prospecteurId) {
      setErrors((prev) => ({
        ...prev,
        [prospectId]: "Sélectionnez un prospecteur.",
      }));
      return;
    }

    const orphan = orphans.find((item) => item.id === prospectId);
    const prospecteur = prospecteurs.find((item) => item.id === prospecteurId);

    setPendingId(prospectId);
    setErrors((prev) => ({ ...prev, [prospectId]: "" }));

    startTransition(async () => {
      const result = await assignProspectAction(prospectId, prospecteurId);

      if (result.error) {
        setErrors((prev) => ({ ...prev, [prospectId]: result.error! }));
        setPendingId(null);
        return;
      }

      markOrphanAssigned(prospectId, prospecteurId);
      setSelections((prev) => {
        const next = { ...prev };
        delete next[prospectId];
        return next;
      });
      setCheckedIds((current) => {
        const next = new Set(current);
        next.delete(prospectId);
        return next;
      });
      setPendingId(null);

      toast({
        variant: "success",
        title: "Lead assigné",
        description: orphan
          ? `${orphan.entreprise} → ${prospecteur ? getProfileDisplayName(prospecteur) : "prospecteur"}`
          : "Le lead a été assigné au prospecteur.",
      });
    });
  }

  function handleBulkAssign() {
    const ids = [...checkedIds];

    if (ids.length === 0) {
      setBulkError("Cochez au moins un lead.");
      return;
    }

    if (!bulkProspecteurId) {
      setBulkError("Choisissez un prospecteur pour l'assignation en masse.");
      return;
    }

    const prospecteur = prospecteurs.find((item) => item.id === bulkProspecteurId);
    setBulkError(null);

    startTransition(async () => {
      const result = await assignProspectsBulkAction(ids, bulkProspecteurId);

      if (result.error) {
        setBulkError(result.error);
        toast({
          variant: "error",
          title: "Assignation en masse échouée",
          description: result.error,
        });
        return;
      }

      const assignedIds = result.assignedIds ?? [];
      markOrphansAssignedBulk(assignedIds, bulkProspecteurId);
      setCheckedIds(new Set());
      setSelections((prev) => {
        const next = { ...prev };
        for (const id of assignedIds) {
          delete next[id];
        }
        return next;
      });

      toast({
        variant: "success",
        title: "Assignation en masse réussie",
        description: `${assignedIds.length} lead${assignedIds.length > 1 ? "s" : ""} → ${
          prospecteur ? getProfileDisplayName(prospecteur) : "prospecteur"
        }`,
      });
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          selectedCount > 0
            ? "border-amber-500/30 bg-amber-500/[0.06]"
            : "border-border/60 bg-muted/20"
        )}
      >
        <div className="flex items-center gap-3">
          <Users className="size-4 shrink-0 text-amber-700" />
          <p className="text-sm font-medium text-foreground">
            {selectedCount > 0
              ? `${selectedCount} lead${selectedCount > 1 ? "s" : ""} sélectionné${selectedCount > 1 ? "s" : ""}`
              : "Assignation en masse"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={bulkProspecteurId}
            onChange={(event) => {
              setBulkProspecteurId(event.target.value);
              setBulkError(null);
            }}
            disabled={prospecteurs.length === 0 || isPending}
            className="h-9 min-w-[200px] rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="">Prospecteur pour la sélection…</option>
            {prospecteurs.map((prospecteur) => (
              <option key={prospecteur.id} value={prospecteur.id}>
                {getProfileDisplayName(prospecteur)}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            loading={isPending && pendingId === null}
            disabled={prospecteurs.length === 0 || selectedCount === 0}
            onClick={() => handleBulkAssign()}
            className="gap-1.5"
          >
            <UserPlus className="size-3.5" />
            Assigner la sélection
          </Button>
        </div>
      </div>

      {bulkError ? <p className="text-sm text-destructive">{bulkError}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={(event) => toggleAll(event.target.checked)}
                    disabled={isPending}
                    aria-label="Tout sélectionner"
                    className="size-4 rounded border-border accent-primary"
                  />
                </th>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Assigner à</th>
                <th className="px-4 py-3">Fiche</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orphans.map((orphan) => {
                const isRowPending = isPending && pendingId === orphan.id;
                const rowError = errors[orphan.id];
                const isChecked = checkedIds.has(orphan.id);

                return (
                  <tr
                    key={orphan.id}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      isChecked && "bg-amber-500/[0.04]"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => toggleOne(orphan.id, event.target.checked)}
                        disabled={isPending}
                        aria-label={`Sélectionner ${orphan.entreprise}`}
                        className="size-4 rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={buildProspectHref(orphan.id, BACK_FROM)}
                        className="transition-colors hover:text-amber-700 hover:underline"
                      >
                        {orphan.entreprise}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{orphan.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {orphan.telephone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getProspectCountryBadge(orphan.pays)}
                    </td>
                    <td className="px-4 py-3">
                      {orphan.ia_score !== null ? (
                        <Badge variant="outline">{orphan.ia_score}/100</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{orphan.statut}</td>
                    <td className="px-4 py-3">
                      <select
                        value={selections[orphan.id] ?? ""}
                        onChange={(event) =>
                          setSelections((prev) => ({
                            ...prev,
                            [orphan.id]: event.target.value,
                          }))
                        }
                        disabled={prospecteurs.length === 0 || isRowPending}
                        className="h-9 w-full max-w-[200px] rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        <option value="">Choisir…</option>
                        {prospecteurs.map((prospecteur) => (
                          <option key={prospecteur.id} value={prospecteur.id}>
                            {getProfileDisplayName(prospecteur)}
                          </option>
                        ))}
                      </select>
                      {rowError ? (
                        <p className="mt-1 text-xs text-destructive">{rowError}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={buildProspectHref(orphan.id, BACK_FROM)}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                      >
                        <ExternalLink className="size-3.5" />
                        Voir
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        loading={isRowPending}
                        disabled={prospecteurs.length === 0}
                        onClick={() => handleAssign(orphan.id)}
                      >
                        <UserPlus className="size-3.5" />
                        Assigner
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
