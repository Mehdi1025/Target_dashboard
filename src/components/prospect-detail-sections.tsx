"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lightbulb,
} from "lucide-react";

import { formatValue } from "@/lib/prospect-utils";
import { cn } from "@/lib/utils";
import type { ProspectDetailCore } from "@/types/prospect";

const AUDIT_SECTIONS = [
  {
    key: "analyse",
    label: "Analyse",
    title: "Analyse du site",
    field: "analyse_site" as const,
    icon: FileText,
    accent: "from-primary/10 to-primary/[0.02]",
    border: "border-primary/20",
    iconBg: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  {
    key: "forces",
    label: "Forces",
    title: "Forces identifiées",
    field: "forces" as const,
    icon: CheckCircle2,
    accent: "from-emerald-500/10 to-emerald-500/[0.02]",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    key: "faiblesses",
    label: "Faiblesses",
    title: "Points de rupture",
    field: "faiblesses" as const,
    icon: AlertTriangle,
    accent: "from-rose-500/10 to-rose-500/[0.02]",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10 text-rose-600",
    dot: "bg-rose-500",
  },
  {
    key: "proposition",
    label: "Proposition",
    title: "Proposition commerciale",
    field: "proposition_commerciale" as const,
    icon: Lightbulb,
    accent: "from-violet-500/10 to-violet-500/[0.02]",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10 text-violet-600",
    dot: "bg-violet-500",
  },
] as const;

type ProspectDetailAuditProps = {
  prospect: ProspectDetailCore;
};

export function ProspectDetailAudit({ prospect }: ProspectDetailAuditProps) {
  const [active, setActive] = useState<(typeof AUDIT_SECTIONS)[number]["key"]>("analyse");
  const section = AUDIT_SECTIONS.find((s) => s.key === active) ?? AUDIT_SECTIONS[0];
  const Icon = section.icon;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/50 shadow-sm ring-1 ring-border/30">
      <div className="border-b border-border/30 px-6 py-5 lg:px-8">
        <div className="flex items-start gap-4">
          <span className="font-mono text-3xl font-black tabular-nums leading-none text-primary/15">
            02
          </span>
          <div>
            <p className="section-eyebrow">Intelligence artificielle</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Audit IA</h2>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto border-b border-border/30 p-4 lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
          {AUDIT_SECTIONS.map((item) => {
            const NavIcon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/80 hover:text-foreground"
                )}
              >
                <NavIcon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
                {isActive ? (
                  <span className="ml-auto hidden size-1.5 rounded-full bg-white/80 lg:block" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div
          className={cn(
            "bento-shine min-h-[280px] bg-gradient-to-br p-6 lg:p-8",
            section.accent
          )}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-xl", section.iconBg)}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", section.dot)} />
                {section.label}
              </p>
              <h3 className="font-bold text-foreground">{section.title}</h3>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-[0.925rem] leading-[1.85] text-foreground/75">
            {formatValue(prospect[section.field])}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProspectDetailIdentity({ prospect }: { prospect: ProspectDetailCore }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/50 shadow-sm ring-1 ring-border/30">
      <div className="border-b border-border/30 px-6 py-5 lg:px-8">
        <div className="flex items-start gap-4">
          <span className="font-mono text-3xl font-black tabular-nums leading-none text-primary/15">
            01
          </span>
          <div>
            <p className="section-eyebrow">Enrichissement</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Identité & entreprise</h2>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border/30 sm:grid-cols-2 lg:grid-cols-3">
        <BentoTile label="Prénom" value={prospect.prenom} className="lg:col-span-1" highlight />
        <BentoTile label="Nom" value={prospect.nom} />
        <BentoTile label="Email" value={prospect.email} highlight />
        <BentoTile label="Poste" value={prospect.poste} />
        <BentoTile label="Site web" value={prospect.url} href={prospect.url} />
        <BentoTile label="Secteur" value={prospect.secteur} />
        <BentoTile label="Taille" value={prospect.taille_entreprise} />
        <BentoTile label="Chiffre d'affaires" value={prospect.chiffre_affaires} />
        <BentoTile label="Année création" value={prospect.annee_creation} />
      </div>
    </section>
  );
}

function BentoTile({
  label,
  value,
  href,
  highlight,
  className,
}: {
  label: string;
  value: string | null;
  href?: string | null;
  highlight?: boolean;
  className?: string;
}) {
  const display = formatValue(value);

  return (
    <div
      className={cn(
        "bento-shine bg-white/50 p-5 backdrop-blur-sm transition-colors hover:bg-white/80",
        highlight && "bg-primary/[0.03]",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      {href && value ? (
        <a
          href={href.startsWith("http") ? href : `https://${href}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-sm font-bold text-primary hover:underline"
        >
          {display}
        </a>
      ) : (
        <p className="mt-2 text-sm font-bold text-foreground">{display}</p>
      )}
    </div>
  );
}
