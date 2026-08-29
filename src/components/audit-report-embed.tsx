"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuditReportEmbedProps = {
  slug: string;
  companyName: string;
  visible?: boolean;
};

export function AuditReportEmbed({
  slug,
  companyName,
  visible = true,
}: AuditReportEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const auditPath = `/audit/${slug}`;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = auditPath;
    link.as = "document";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [auditPath]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl",
        !visible &&
          "pointer-events-none fixed -left-[9999px] top-0 h-[85vh] w-[1200px] opacity-0"
      )}
      aria-hidden={!visible}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-800 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-50">Rapport Brand / Audit</p>
          <p className="text-xs text-zinc-400">Rapport Awwards — {companyName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isLoaded ? (
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              Chargement…
            </span>
          ) : null}
          <Link
            href={auditPath}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            )}
          >
            <ExternalLink className="size-3.5" />
            Plein écran
          </Link>
        </div>
      </div>

      <div className="relative min-h-[75vh] bg-zinc-950">
        {!isLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
            <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400" />
            <p className="text-sm text-zinc-400">Ouverture du rapport…</p>
          </div>
        ) : null}
        <iframe
          src={auditPath}
          title={`Rapport Brand Audit — ${companyName}`}
          loading="eager"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "h-[75vh] w-full border-0 bg-zinc-950 transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}

export function AuditReportMissing() {
  return (
    <div className="glass-panel rounded-2xl px-6 py-16 text-center">
      <p className="text-base font-semibold text-foreground">Rapport non disponible</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Générez d&apos;abord le lien client pour accéder au rapport audit.
      </p>
    </div>
  );
}

export function AuditReportPending() {
  return (
    <div className="glass-panel rounded-2xl px-6 py-16 text-center">
      <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <p className="text-base font-semibold text-foreground">Rapport en génération</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Le HTML n&apos;a pas encore été produit par n8n.
      </p>
    </div>
  );
}
