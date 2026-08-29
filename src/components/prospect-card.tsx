"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Building2, CalendarCheck, Check, Mail, User } from "lucide-react";

import { declareRDV } from "@/app/actions/rdv-actions";

import { AuditLinkActions } from "@/components/audit-link-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatValue,
  getFullName,
  getStatutBadgeClass,
} from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import { canDeclareRdvFromStatus, getRdvBadgeClass, RDV_STATUS_LABELS } from "@/lib/rdv-utils";
import { useTrackActivity } from "@/hooks/use-track-activity";
import type { ProspectListItem } from "@/types/prospect";
import type { RdvStatus } from "@/types/database.types";

type ProspectCardProps = {
  prospect: ProspectListItem;
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

export function ProspectCard({ prospect }: ProspectCardProps) {
  const [statut, setStatut] = useState(prospect.statut);
  const [rdvStatus, setRdvStatus] = useState<RdvStatus>(prospect.rdv_status ?? "NONE");
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclaringRdv, setIsDeclaringRdv] = useState(false);
  const [rdvError, setRdvError] = useState<string | null>(null);
  const { logAction } = useTrackActivity();
  const isApproved =
    statut.toLowerCase().includes("approuv") || statut.toLowerCase().includes("envoy");
  const canDeclareRdv = canDeclareRdvFromStatus(rdvStatus);

  async function handleDeclareRdv() {
    if (!canDeclareRdv || isDeclaringRdv) return;

    setIsDeclaringRdv(true);
    setRdvError(null);

    try {
      const result = await declareRDV(prospect.id);
      if (!result.ok) {
        setRdvError(result.error ?? "Impossible de déclarer le RDV.");
        return;
      }
      setRdvStatus("PENDING");
    } catch {
      setRdvError("Erreur réseau.");
    } finally {
      setIsDeclaringRdv(false);
    }
  }

  async function handleApprove() {
    if (isApproved || isApproving) return;

    const previousStatut = statut;
    setStatut("Approuvé");
    setIsApproving(true);

    try {
      const response = await fetch(`/api/prospects/${prospect.id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "Approuvé" }),
      });

      if (!response.ok) {
        throw new Error("Échec");
      }

      logAction("APPROVE_LEAD", prospect.id, {
        entreprise: prospect.entreprise,
        statut: "Approuvé",
      });
    } catch {
      setStatut(previousStatut);
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <article className="glass-panel card-hover-lift group flex flex-col rounded-2xl p-5">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
        <Link
          href={`/prospects/${prospect.id}`}
          prefetch
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1 text-muted-foreground hover:text-primary"
          )}
        >
          Ouvrir
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <AuditLinkActions
          prospectId={prospect.id}
          entreprise={prospect.entreprise}
          slug={prospect.slug}
          variant="inline"
        />
        {canDeclareRdv ? (
          <Button
            size="sm"
            variant="outline"
            className="border-orange-500/40 text-orange-700 hover:bg-orange-500/10"
            onClick={handleDeclareRdv}
            loading={isDeclaringRdv}
            disabled={isDeclaringRdv}
          >
            <CalendarCheck className="size-3.5" />
            Déclarer un RDV
          </Button>
        ) : null}
        <Button
          size="sm"
          className="ml-auto shadow-sm shadow-primary/20"
          onClick={handleApprove}
          loading={isApproving}
          disabled={isApproved}
          variant={isApproved ? "secondary" : "default"}
        >
          {isApproved ? (
            <>
              <Check className="size-3.5" />
              Approuvé
            </>
          ) : (
            "Approuver"
          )}
        </Button>
      </div>
      {rdvError ? (
        <p className="mt-2 text-xs text-destructive">{rdvError}</p>
      ) : null}
    </article>
  );
}
