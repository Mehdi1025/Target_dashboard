"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { ProspectCard } from "@/components/prospect-card";
import { cn } from "@/lib/utils";
import type { ProspectListItem } from "@/types/prospect";

type ProspectsBoardProps = {
  prospects: ProspectListItem[];
};

type FilterKey = "all" | "valider" | "approuve" | "autre";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "valider", label: "À valider" },
  { key: "approuve", label: "Approuvés" },
  { key: "autre", label: "Autres" },
];

function matchesFilter(prospect: ProspectListItem, filter: FilterKey) {
  const statut = prospect.statut.toLowerCase();

  if (filter === "all") return true;
  if (filter === "valider") return statut.includes("valider");
  if (filter === "approuve") {
    return statut.includes("approuv") || statut.includes("envoy");
  }
  return !statut.includes("valider") && !statut.includes("approuv") && !statut.includes("envoy");
}

export function ProspectsBoard({ prospects }: ProspectsBoardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return prospects.filter((prospect) => {
      if (!matchesFilter(prospect, filter)) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        prospect.entreprise,
        prospect.prenom,
        prospect.nom,
        prospect.email,
        prospect.poste,
        prospect.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [prospects, query, filter]);

  if (prospects.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SlidersHorizontal className="size-6" />
        </div>
        <p className="text-lg font-semibold text-foreground">Pipeline vide</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Les prospects générés par l&apos;IA apparaîtront ici dès que n8n alimente Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher entreprise, contact, email…"
            className={cn(
              "h-11 w-full rounded-xl border border-border/80 bg-white/80 pl-10 pr-4 text-sm",
              "placeholder:text-muted-foreground/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            )}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-[transform,background-color,color,box-shadow] duration-150 active:scale-95",
                filter === item.key
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border border-border/80 bg-white/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl px-6 py-14 text-center">
          <p className="font-medium text-foreground">Aucun résultat</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez votre recherche ou changez de filtre.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} />
          ))}
        </div>
      )}
    </div>
  );
}
