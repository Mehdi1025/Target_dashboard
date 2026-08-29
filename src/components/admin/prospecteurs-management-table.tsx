import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { ProspecteurManagementRow } from "@/lib/admin-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { cn } from "@/lib/utils";

type ProspecteursManagementTableProps = {
  rows: ProspecteurManagementRow[];
};

export function ProspecteursManagementTable({ rows }: ProspecteursManagementTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] px-6 py-12 text-center">
        <UserRound className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Aucun prospecteur inscrit
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Créez des comptes avec le rôle &quot;prospecteur&quot; dans Supabase Auth.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/15 bg-white/60 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-amber-500/[0.04] text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3.5">Prospecteur</th>
              <th className="px-5 py-3.5">Assignés</th>
              <th className="px-5 py-3.5">À valider</th>
              <th className="px-5 py-3.5">Approuvés</th>
              <th className="px-5 py-3.5">Score moy.</th>
              <th className="px-5 py-3.5">Conversion</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile, stats, tauxApprobation }) => (
              <tr
                key={profile.id}
                className="border-b border-border/40 transition-colors last:border-0 hover:bg-amber-500/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-700">
                      {getProfileDisplayName(profile).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {getProfileDisplayName(profile)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono font-semibold">{stats.total}</td>
                <td className="px-5 py-4">
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5">
                    {stats.aValider}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5">
                    {stats.approuves}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-mono">
                  {stats.scoreMoyen !== null ? `${stats.scoreMoyen}/100` : "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${tauxApprobation}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-medium">{tauxApprobation}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/prospecteurs/${profile.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    Gérer
                    <ArrowRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
