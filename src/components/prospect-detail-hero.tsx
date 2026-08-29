"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  TrendingUp,
  User,
} from "lucide-react";

import { ProspectScoreBadge, ProspectScoreRing } from "@/components/prospect-score-ring";
import { Badge } from "@/components/ui/badge";
import { getFullName, getStatutBadgeClass } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import type { ProspectDetailCore } from "@/types/prospect";

type ProspectDetailHeroProps = {
  prospect: ProspectDetailCore;
};

function getInitials(entreprise: string) {
  return entreprise
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProspectDetailHero({ prospect }: ProspectDetailHeroProps) {
  const fullName = getFullName(prospect.prenom, prospect.nom);

  return (
    <section className="prospect-page-mesh relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 shadow-[0_20px_60px_oklch(0.2_0.03_265/0.1)] backdrop-blur-2xl">
      <div className="prospect-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -right-24 top-0 size-96 rounded-full bg-gradient-to-br from-primary/15 to-violet-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-indigo-300/10 blur-3xl" />

      <div className="relative border-b border-border/30 px-6 py-5 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-white/80 transition-transform group-hover:-translate-x-0.5">
            <ArrowLeft className="size-3.5" />
          </span>
          Retour pipeline
        </Link>
      </div>

      <div className="relative grid gap-10 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10 lg:pb-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="section-eyebrow">Dossier prospect</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-[10px] text-muted-foreground">
              #{prospect.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-primary/30 to-violet-400/20 blur-sm" />
              <div className="relative flex size-[5.5rem] items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary via-primary to-indigo-600 text-3xl font-black tracking-tighter text-white shadow-xl shadow-primary/25">
                {getInitials(prospect.entreprise) || "?"}
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    getStatutBadgeClass(prospect.statut)
                  )}
                >
                  {prospect.statut}
                </Badge>
                {prospect.ia_score !== null ? (
                  <ProspectScoreBadge score={prospect.ia_score} />
                ) : null}
              </div>
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-foreground">
                {prospect.entreprise}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ContactPill icon={User} label={fullName} sub={prospect.poste} />
            <ContactPill icon={Mail} label={prospect.email} />
            {prospect.secteur ? (
              <ContactPill icon={MapPin} label={prospect.secteur} sub="Secteur" />
            ) : null}
          </div>
        </div>

        {prospect.ia_score !== null ? (
          <div className="bento-shine flex items-center gap-5 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-lg ring-1 ring-border/30 lg:min-w-[240px]">
            <ProspectScoreRing score={prospect.ia_score} size="lg" />
            <div>
              <p className="section-eyebrow">Score IA</p>
              <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">
                {prospect.ia_score}
                <span className="text-sm font-medium text-muted-foreground">/100</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3 text-emerald-500" />
                Qualification auto
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative grid gap-px border-t border-border/30 bg-border/20 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCell icon={Building2} label="Taille" value={prospect.taille_entreprise} />
        <MetaCell icon={Globe} label="Site web" value={prospect.url} href={prospect.url} />
        <MetaCell icon={TrendingUp} label="CA" value={prospect.chiffre_affaires} />
        <MetaCell icon={Calendar} label="Ajouté" value={formatDate(prospect.created_at)} />
      </div>
    </section>
  );
}

function ContactPill({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof User;
  label: string;
  sub?: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-border/40 bg-white/60 px-4 py-2.5 shadow-sm">
      <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        {sub ? <p className="truncate text-[11px] text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null | undefined;
  href?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 bg-white/40 px-5 py-4 backdrop-blur-sm">
      <Icon className="size-4 shrink-0 text-primary/50" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {href ? (
          <a
            href={href.startsWith("http") ? href : `https://${href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-sm font-semibold text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
