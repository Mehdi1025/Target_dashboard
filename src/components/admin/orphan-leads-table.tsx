"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { assignProspectAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/contexts/admin-data-context";
import { useToast } from "@/hooks/use-toast";
import { getProfileDisplayName } from "@/lib/profile-utils";

export function OrphanLeadsTable() {
  const { orphans, prospecteurs, markOrphanAssigned } = useAdminData();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  if (orphans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-emerald-700">
          Aucun lead orphelin — tout est assigné.
        </p>
      </div>
    );
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

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Assigner à</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orphans.map((orphan) => {
              const isRowPending = isPending && pendingId === orphan.id;
              const rowError = errors[orphan.id];

              return (
                <tr
                  key={orphan.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{orphan.entreprise}</td>
                  <td className="px-4 py-3 text-muted-foreground">{orphan.email}</td>
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
  );
}
