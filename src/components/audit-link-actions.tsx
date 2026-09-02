"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTrackActivity } from "@/hooks/use-track-activity";
import { getPublicAuditUrl } from "@/lib/slug";
import { cn } from "@/lib/utils";

type AuditLinkActionsProps = {
  prospectId: string;
  entreprise: string;
  slug: string | null;
  variant?: "card" | "inline";
};

export function AuditLinkActions({
  prospectId,
  entreprise,
  slug: initialSlug,
  variant = "card",
}: AuditLinkActionsProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logAction } = useTrackActivity();

  async function handleGenerateSlug() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/prospects/${prospectId}/slug`, {
        method: "POST",
      });
      const payload = (await response.json()) as { slug?: string; error?: string };

      if (!response.ok || !payload.slug) {
        throw new Error(payload.error ?? "Génération du slug impossible.");
      }

      setSlug(payload.slug);
      logAction("GENERATE_LINK", prospectId, {
        entreprise,
        slug: payload.slug,
      });
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Génération du slug impossible."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (!slug) {
    if (variant === "inline") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSlug}
          loading={isGenerating}
        >
          Générer le lien
        </Button>
      );
    }

    return (
      <div className="glass-panel rounded-2xl border-dashed border-amber-500/30 bg-amber-500/5">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lien client — slug manquant</CardTitle>
            <CardDescription>
              Ce prospect (<strong>{entreprise}</strong>) n&apos;a pas encore de slug.
              Génère-le en 1 clic, ou configure n8n pour envoyer la colonne{" "}
              <code className="rounded bg-muted px-1 py-0.5">slug</code> à l&apos;insertion.
            </CardDescription>
          </div>
          <Button onClick={handleGenerateSlug} loading={isGenerating}>
            Générer le lien client
          </Button>
        </CardHeader>
        {error ? (
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        ) : null}
      </div>
    );
  }

  const auditUrl = getPublicAuditUrl(slug);

  function handleCopy() {
    setCopied(true);
    void navigator.clipboard.writeText(auditUrl);
    logAction("COPY_AUDIT_LINK", prospectId, {
      entreprise,
      slug: slug ?? undefined,
    });
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (variant === "inline") {
    return (
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? "Copié !" : "Copier le lien audit"}
      </Button>
    );
  }

  return (
    <div className="bento-shine overflow-hidden rounded-[1.75rem] border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.05] via-white/50 to-violet-500/[0.04] shadow-sm ring-1 ring-indigo-500/10">
      <CardHeader className="flex flex-col gap-4 border-b border-indigo-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20">
            <span className="text-lg">🔗</span>
          </div>
          <div>
            <p className="section-eyebrow">Lien public</p>
            <CardTitle className="text-lg font-bold">Envoyer au client</CardTitle>
            <CardDescription className="mt-0.5">
              Copie et partage par email, WhatsApp ou LinkedIn
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy}>{copied ? "Copié !" : "Copier le lien"}</Button>
          <Link
            href={`/audit/${slug}`}
            target="_blank"
            prefetch={false}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Prévisualiser
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 lg:px-8">
        <div className="break-all rounded-xl border border-indigo-500/10 bg-white/80 px-5 py-4 font-mono text-xs text-foreground ring-1 ring-border/20">
          {auditUrl}
        </div>
      </CardContent>
    </div>
  );
}
