"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Mail,
  User,
} from "lucide-react";

import { AuditLinkActions } from "@/components/audit-link-actions";
import { ProspectCallActions, type ProspectCallPatch } from "@/components/prospect-call-actions";
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
import type { ProspectListItem } from "@/types/prospect";
import type { RdvRejectionReason, RdvStatus } from "@/types/database.types";

type ProspectCardProps = {
  prospect: ProspectListItem;
  profileId?: string;
  onProspectPatch?: (prospectId: string, patch: Partial<ProspectListItem>) => void;
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
        N/A
      </div>
    );
  }

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75
      ? "stroke-emerald-500"
      : score >= 50
        ? "stroke-amber-500"
        : "stroke-rose-400";

  return (
    <div className="relative flex size-14 items-center justify-center">
      <svg className="-rotate-90 size-14" viewBox="0 0 52 52" aria-hidden>
        <circle cx="26" cy="26" r="22" fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500", color)}
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}

function getInitials(entreprise: string) {
  return entreprise
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProspectCard({ prospect, profileId, onProspectPatch }: ProspectCardProps) {
  const [statut, setStatut] = useState(prospect.statut);
  const [rdvStatus, setRdvStatus] = useState<RdvStatus>(prospect.rdv_status ?? "NONE");
  const [rdvRejectionReason, setRdvRejectionReason] = useState<RdvRejectionReason | null>(
    prospect.rdv_rejection_reason ?? null
  );

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

  const showCallQualification = rdvStatus === "NONE" && Boolean(profileId);

  return (
    <article className="glass-panel card-hover-lift group flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-bold text-primary">
            {getInitials(prospect.entreprise) || "?"}
          </div>
          <div className="min-w-0">
            <Link
              href={`/prospects/${prospect.id}`}
              prefetch
              className="block truncate text-base font-semibold tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary"
            >
              {prospect.entreprise}
            </Link>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" />
              {formatValue(prospect.poste)}
            </p>
          </div>
        </div>
        <ScoreRing score={prospect.ia_score} />
      </div>

      <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <User className="size-3.5 shrink-0 text-muted-foreground" />
          {getFullName(prospect.prenom, prospect.nom)}
        </p>
        <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          {prospect.email}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("rounded-full px-2.5 py-0.5 text-[11px]", getStatutBadgeClass(statut))}
        >
          {statut}
        </Badge>
        {rdvStatus !== "NONE" ? (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              getRdvBadgeClass(rdvStatus)
            )}
          >
            RDV · {RDV_STATUS_LABELS[rdvStatus]}
          </Badge>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
        <div className="flex flex-wrap gap-2">
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
            href={`/prospects/${prospect.id}`}
            prefetch
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1 text-muted-foreground hover:text-foreground",
              !showCallQualification && rdvStatus !== "REJECTED" && "ml-auto"
            )}
          >
            Voir la fiche
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <AuditLinkActions
          prospectId={prospect.id}
          entreprise={prospect.entreprise}
          slug={prospect.slug}
          variant="inline"
        />
      </div>
    </article>
  );
}
