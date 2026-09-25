"use client";

import { useEffect, useState, useTransition } from "react";
import { Globe } from "lucide-react";

import { updateProspectCountry } from "@/app/actions/prospect-actions";
import { useToast } from "@/hooks/use-toast";
import {
  getProspectCountryLabel,
  isProspectCountry,
  PROSPECT_COUNTRIES,
  PROSPECT_COUNTRY_FLAGS,
  PROSPECT_COUNTRY_LABELS,
  type ProspectCountry,
} from "@/lib/prospect-country";
import { cn } from "@/lib/utils";

type ProspectCountrySelectProps = {
  prospectId: string;
  entreprise: string;
  pays: string | null;
  editable?: boolean;
  layout?: "inline" | "sidebar";
  onChange?: (pays: ProspectCountry) => void;
};

export function ProspectCountrySelect({
  prospectId,
  entreprise,
  pays,
  editable = false,
  layout = "inline",
  onChange,
}: ProspectCountrySelectProps) {
  const { toast } = useToast();
  const [localPays, setLocalPays] = useState<string | null>(pays);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSidebar = layout === "sidebar";

  useEffect(() => {
    setLocalPays(pays);
  }, [pays]);

  function handleChange(nextValue: string) {
    if (!editable || !isProspectCountry(nextValue) || nextValue === localPays) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateProspectCountry(prospectId, nextValue);
      if (!result.ok) {
        setError(result.error ?? "Erreur.");
        toast({
          variant: "error",
          title: "Pays non enregistré",
          description: result.error ?? "Impossible de mettre à jour le pays.",
        });
        return;
      }

      setLocalPays(nextValue);
      onChange?.(nextValue);
      toast({
        variant: "success",
        title: "Pays mis à jour",
        description: `${entreprise} → ${PROSPECT_COUNTRY_LABELS[nextValue]}`,
      });
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-white/60 px-3 py-2.5",
        isSidebar && "w-full",
        editable && "border-primary/20 bg-primary/[0.03]"
      )}
    >
      <div className={cn("flex items-center gap-2", isSidebar && "flex-col items-stretch sm:flex-row")}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Globe className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pays du lead
            </p>
            {!editable ? (
              <p className="truncate text-sm font-semibold text-foreground">
                {getProspectCountryLabel(localPays)}
              </p>
            ) : null}
          </div>
        </div>

        {editable ? (
          <select
            value={localPays && isProspectCountry(localPays) ? localPays : ""}
            onChange={(event) => handleChange(event.target.value)}
            disabled={isPending}
            className={cn(
              "h-9 rounded-lg border border-border bg-background px-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
              isSidebar ? "w-full sm:min-w-[160px] sm:flex-1" : "min-w-[140px]"
            )}
          >
            <option value="" disabled>
              Choisir le pays…
            </option>
            {PROSPECT_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {PROSPECT_COUNTRY_FLAGS[code]} {PROSPECT_COUNTRY_LABELS[code]}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm font-semibold text-foreground">
            {localPays && isProspectCountry(localPays)
              ? `${PROSPECT_COUNTRY_FLAGS[localPays]} ${PROSPECT_COUNTRY_LABELS[localPays]}`
              : "—"}
          </p>
        )}
      </div>

      {editable && !localPays ? (
        <p className="mt-2 text-[11px] text-amber-700">
          Sélectionnez le pays avant de qualifier l&apos;appel.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
