"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { AdminDataGate } from "@/components/admin/admin-data-gate";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useAdminData } from "@/contexts/admin-data-context";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { getStatutBadgeClass } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";

const BACK_FROM = "/admin/leads";

export function AdminLeadsView() {
  const { prospects, prospecteurs } = useAdminData();
  const [query, setQuery] = useState("");

  const prospecteurById = useMemo(
    () => Object.fromEntries(prospecteurs.map((profile) => [profile.id, profile])),
    [prospecteurs]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return prospects;

    return prospects.filter((prospect) => {
      const prospecteur = prospect.assigned_to
        ? prospecteurById[prospect.assigned_to]
        : null;
      const haystack = [
        prospect.entreprise,
        prospect.prenom,
        prospect.nom,
        prospect.email,
        prospect.statut,
        prospecteur ? getProfileDisplayName(prospecteur) : "orphelin",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [prospects, prospecteurById, query]);

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Target OS · Leads
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Toutes les{" "}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              fiches leads.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Consultez le dossier complet de chaque prospect — rapport IA, notes, script email
            et audit client.
          </p>
        </div>
      </section>

      <AdminDataGate skeletonRows={4}>
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher entreprise, contact, email…"
              className="h-11 w-full rounded-xl border border-border/70 bg-white/70 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Entreprise</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Prospecteur</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        Aucun lead ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((prospect) => {
                      const prospecteur = prospect.assigned_to
                        ? prospecteurById[prospect.assigned_to]
                        : null;

                      return (
                        <tr
                          key={prospect.id}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            <Link
                              href={`/prospects/${prospect.id}?from=${encodeURIComponent(BACK_FROM)}`}
                              className="transition-colors hover:text-amber-700 hover:underline"
                            >
                              {prospect.entreprise}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{prospect.email}</td>
                          <td className="px-4 py-3">
                            {prospect.ia_score !== null ? (
                              <Badge variant="outline">{prospect.ia_score}/100</Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px]", getStatutBadgeClass(prospect.statut))}
                            >
                              {prospect.statut}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {prospecteur ? (
                              <Link
                                href={`/admin/prospecteurs/${prospecteur.id}`}
                                className="text-amber-800 transition-colors hover:underline"
                              >
                                {getProfileDisplayName(prospecteur)}
                              </Link>
                            ) : (
                              <span className="text-orange-700">Orphelin</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/prospects/${prospect.id}?from=${encodeURIComponent(BACK_FROM)}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                            >
                              <ExternalLink className="size-3.5" />
                              Fiche
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} lead{filtered.length > 1 ? "s" : ""} affiché
            {filtered.length !== prospects.length ? ` sur ${prospects.length}` : ""}
          </p>
        </div>
      </AdminDataGate>
    </div>
  );
}
