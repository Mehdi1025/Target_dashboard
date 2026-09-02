import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Mail,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { TeamPulseMember } from "@/lib/team-pulse";
import { cn } from "@/lib/utils";

type TeamFichesGridProps = {
  members: TeamPulseMember[];
};

export function TeamFichesGrid({ members }: TeamFichesGridProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
          Fiches équipe
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
          Profils prospecteurs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline assigné, performance et historique — accès direct à chaque fiche détaillée.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <FicheCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}

function FicheCard({ member }: { member: TeamPulseMember }) {
  const joinedDate = new Date(member.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group overflow-hidden rounded-2xl border border-amber-500/15 bg-white/60 shadow-sm transition-all hover:border-amber-500/30 hover:shadow-md">
      <div className="border-b border-border/40 bg-gradient-to-r from-amber-500/[0.05] to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-xl font-bold text-violet-700">
            {member.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold tracking-tight">{member.displayName}</h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {member.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                prospecteur
              </Badge>
              {member.volumeBonusUnlocked ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700">
                  Bonus débloqué
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/40">
        <StatCell label="Leads assignés" value={String(member.assignedCount)} />
        <StatCell label="À valider" value={String(member.aValider)} highlight={member.aValider > 0} />
        <StatCell label="Approuvés" value={String(member.approuves)} />
        <StatCell
          label="Score moy."
          value={member.scoreMoyen !== null ? `${member.scoreMoyen}/100` : "—"}
        />
        <StatCell
          label="RDV semaine"
          value={`${member.rdvValidatedWeek}/${member.rdvWeeklyTarget}`}
        />
        <StatCell label="Conversion" value={`${member.tauxApprobation}%`} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/40 px-5 py-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          Inscrit {joinedDate}
        </p>
        <Link
          href={`/admin/prospecteurs/${member.id}`}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm hover:from-amber-600 hover:to-orange-700"
          )}
        >
          Ouvrir la fiche
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white/80 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-lg font-bold",
          highlight && "text-amber-700"
        )}
      >
        {value}
      </p>
    </div>
  );
}
