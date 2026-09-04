"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import { AuditLinkActions } from "@/components/audit-link-actions";
import { ProspectCallActions, type ProspectCallPatch } from "@/components/prospect-call-actions";
import { ProspectScoreBadge, ProspectScoreRing } from "@/components/prospect-score-ring";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  formatValue,
  getFullName,
  getStatutBadgeClass,
} from "@/lib/prospect-utils";
import {
  getRdvBadgeClass,
  RDV_STATUS_LABELS,
} from "@/lib/rdv-utils";
import { cn } from "@/lib/utils";
import { buildProspectHref } from "@/lib/admin-navigation";
import type { ProspectListItem } from "@/types/prospect";
import type { RdvRejectionReason, RdvStatus } from "@/types/database.types";

type ProspectCardProps = {
  prospect: ProspectListItem;
  profileId?: string;
  detailFrom?: string;
  onProspectPatch?: (prospectId: string, patch: Partial<ProspectListItem>) => void;
};

type ScoreTier = "hot" | "warm" | "cold" | "none";

function getScoreTier(score: number | null): ScoreTier {
  if (score === null) return "none";
  if (score >= 75) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

const TIER_STYLES: Record<
  ScoreTier,
  { accent: string; avatar: string; glow: string; ring: string }
> = {
  hot: {
    accent: "from-emerald-400 via-emerald-500 to-teal-500",
    avatar: "from-emerald-500/20 via-emerald-500/10 to-teal-500/5 text-emerald-700 ring-emerald-500/25",
    glow: "group-hover:shadow-emerald-500/10",
    ring: "group-hover:ring-emerald-500/20",
  },
  warm: {
    accent: "from-amber-400 via-amber-500 to-orange-400",
    avatar: "from-amber-500/20 via-amber-500/10 to-orange-500/5 text-amber-800 ring-amber-500/25",
    glow: "group-hover:shadow-amber-500/10",
    ring: "group-hover:ring-amber-500/20",
  },
  cold: {
    accent: "from-rose-400 via-rose-500 to-pink-400",
    avatar: "from-rose-500/15 via-rose-500/8 to-pink-500/5 text-rose-700 ring-rose-500/20",
    glow: "group-hover:shadow-rose-500/10",
    ring: "group-hover:ring-rose-500/15",
  },
  none: {
    accent: "from-primary/60 via-primary to-violet-500/80",
    avatar: "from-primary/15 to-primary/5 text-primary ring-primary/20",
    glow: "group-hover:shadow-primary/10",
    ring: "group-hover:ring-primary/15",
  },
};

function getInitials(entreprise: string) {
  return entreprise
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProspectCard({
  prospect,
  profileId,
  detailFrom,
  onProspectPatch,
}: ProspectCardProps) {
  const [statut, setStatut] = useState(prospect.statut);
  const [rdvStatus, setRdvStatus] = useState<RdvStatus>(prospect.rdv_status ?? "NONE");
  const [rdvRejectionReason, setRdvRejectionReason] = useState<RdvRejectionReason | null>(
    prospect.rdv_rejection_reason ?? null
  );

  const tier = getScoreTier(prospect.ia_score);
  const tierStyle = TIER_STYLES[tier];

  useEffect(() => {
    setRdvStatus(prospect.rdv_status ?? "NONE");
  }, [prospect.rdv_status]);

  useEffect(() => {
    setRdvRejectionReason(prospect.rdv_rejection_reason ?? null);
  }, [prospect.rdv_rejection_reason]);

  useEffect(() => {
    setStatut(prospect.statut);
  }, [prospect.statut]);

  function handleCallPatch(patch: ProspectCallPatch) {
    if (patch.statut) {
      setStatut(patch.statut);
    }
    if (patch.rdv_status) {
      setRdvStatus(patch.rdv_status);
    }
    if (patch.rdv_rejection_reason !== undefined) {
      setRdvRejectionReason(patch.rdv_rejection_reason);
    }
    onProspectPatch?.(prospect.id, patch);
  }

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.35rem]",
        "border border-white/80 bg-white/75 shadow-[0_1px_2px_oklch(0.2_0.02_265/0.04),0_12px_40px_oklch(0.2_0.02_265/0.07)]",
        "ring-1 ring-border/40 backdrop-blur-xl",
        "transition-[transform,box-shadow,ring-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_30px_oklch(0.2_0.02_265/0.1)]",
        tierStyle.glow,
        tierStyle.ring
      )}
    >
      <div
        className={cn("h-1 w-full bg-gradient-to-r opacity-90", tierStyle.accent)}
        aria-hidden
      />

      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-white/80 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-black tracking-tight ring-1",
                tierStyle.avatar
              )}
            >
              {getInitials(prospect.entreprise) || "?"}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-foreground">
                {prospect.entreprise}
              </p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Building2 className="size-3 shrink-0 opacity-60" />
                {formatValue(prospect.poste)}
              </p>
              {prospect.ia_score !== null ? (
                <div className="mt-2">
                  <ProspectScoreBadge score={prospect.ia_score} />
                </div>
              ) : null}
            </div>
          </div>
          <ProspectScoreRing score={prospect.ia_score} className="shrink-0" />
        </div>

        <div className="mt-4 space-y-2.5 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-muted-foreground shadow-sm ring-1 ring-border/40">
              <User className="size-3.5" />
            </span>
            <p className="truncate text-sm font-medium text-foreground">
              {getFullName(prospect.prenom, prospect.nom)}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-muted-foreground shadow-sm ring-1 ring-border/40">
              <Mail className="size-3.5" />
            </span>
            <p className="truncate text-xs text-muted-foreground">{prospect.email}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              getStatutBadgeClass(statut)
            )}
          >
            {statut}
          </Badge>
          {rdvStatus !== "NONE" ? (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                getRdvBadgeClass(rdvStatus)
              )}
            >
              RDV · {RDV_STATUS_LABELS[rdvStatus]}
            </Badge>
          ) : null}
          {tier === "hot" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <Sparkles className="size-3" />
              Priorité
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-5">
          <div className="rounded-2xl border border-border/40 bg-white/50 p-3 shadow-sm ring-1 ring-white/60">
            <div className="flex flex-wrap items-center gap-2">
              <ProspectCallActions
                prospectId={prospect.id}
                entreprise={prospect.entreprise}
                profileId={profileId}
                rdvStatus={rdvStatus}
                rdvRejectionReason={rdvRejectionReason}
                layout="inline"
                onPatch={handleCallPatch}
              />

              <Link
                href={buildProspectHref(prospect.id, detailFrom)}
                prefetch
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "ml-auto gap-1.5 border-border/70 bg-white/90 shadow-sm",
                  "transition-all hover:border-primary/30 hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/15"
                )}
              >
                Ouvrir la fiche
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="mt-2.5 border-t border-border/30 pt-2.5">
              <AuditLinkActions
                prospectId={prospect.id}
                entreprise={prospect.entreprise}
                slug={prospect.slug}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
