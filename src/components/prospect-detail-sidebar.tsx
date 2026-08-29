"use client";

import Link from "next/link";
import { Copy, ExternalLink, Link2, Mail, Send } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProspectScoreRing } from "@/components/prospect-score-ring";
import { getFullName, getStatutBadgeClass } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import type { ProspectDetailCore } from "@/types/prospect";

type ProspectDetailSidebarProps = {
  prospect: ProspectDetailCore;
  onCopyEmail: () => void;
  copied: boolean;
};

export function ProspectDetailSidebar({
  prospect,
  onCopyEmail,
  copied,
}: ProspectDetailSidebarProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      {prospect.ia_score !== null ? (
        <div className="bento-shine overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-primary/[0.04] to-white/80 p-5 shadow-sm ring-1 ring-border/30">
          <p className="section-eyebrow">Qualification</p>
          <div className="mt-4 flex items-center justify-between">
            <ProspectScoreRing score={prospect.ia_score} size="lg" />
            <div className="text-right">
              <p className="font-mono text-3xl font-black tabular-nums">{prospect.ia_score}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                sur 100
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
              style={{ width: `${prospect.ia_score}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm ring-1 ring-border/30">
        <p className="section-eyebrow">Actions</p>
        <div className="mt-4 space-y-2">
          <Button className="h-10 w-full justify-start gap-3 shadow-md shadow-primary/15" onClick={onCopyEmail} disabled={!prospect.script_email}>
            <span className="flex size-7 items-center justify-center rounded-lg bg-white/20">
              {copied ? <Send className="size-3.5" /> : <Copy className="size-3.5" />}
            </span>
            {copied ? "Email copié !" : "Copier l'email IA"}
          </Button>

          {prospect.url ? (
            <a
              href={prospect.url.startsWith("http") ? prospect.url : `https://${prospect.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full justify-start gap-3 bg-white/50")}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <ExternalLink className="size-3.5" />
              </span>
              Visiter le site
            </a>
          ) : null}

          {prospect.slug ? (
            <Link
              href={`/audit/${prospect.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full justify-start gap-3 bg-white/50")}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Link2 className="size-3.5" />
              </span>
              Audit client
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm ring-1 ring-border/30">
        <p className="section-eyebrow">Fiche résumé</p>
        <dl className="mt-4 divide-y divide-border/40">
          <SummaryItem label="Entreprise" value={prospect.entreprise} />
          <SummaryItem label="Contact" value={getFullName(prospect.prenom, prospect.nom)} />
          <SummaryItem label="Email" value={prospect.email} icon={Mail} />
          <SummaryItem
            label="Statut"
            value={prospect.statut}
            badgeClass={getStatutBadgeClass(prospect.statut)}
          />
          {prospect.secteur ? <SummaryItem label="Secteur" value={prospect.secteur} /> : null}
        </dl>
      </div>
    </aside>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
  badgeClass,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
  badgeClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex max-w-[58%] items-center justify-end gap-1.5 text-right text-xs font-semibold text-foreground">
        {Icon ? <Icon className="size-3 shrink-0 text-muted-foreground" /> : null}
        {badgeClass ? (
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", badgeClass)}>
            {value}
          </span>
        ) : (
          <span className="truncate">{value}</span>
        )}
      </dd>
    </div>
  );
}
