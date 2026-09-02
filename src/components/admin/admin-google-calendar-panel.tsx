"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarCheck, ExternalLink, Link2, Unplug } from "lucide-react";

import { disconnectGoogleCalendarAction } from "@/app/actions/google-calendar-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RdvCalendarPublicSettings } from "@/lib/rdv-calendar-settings";

type AdminGoogleCalendarPanelProps = {
  status: RdvCalendarPublicSettings;
};

const ERROR_MESSAGES: Record<string, string> = {
  access: "Accès refusé.",
  google_config: "Google OAuth non configuré (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
  google_denied: "Connexion Google annulée.",
  google_missing: "Réponse Google incomplète.",
  google_state: "Session OAuth expirée — réessayez.",
  google_no_refresh: "Google n'a pas renvoyé de refresh token — révoquez l'accès et reconnectez.",
  google_save: "Impossible d'enregistrer la connexion.",
  google_exchange: "Échange OAuth échoué.",
};

export function AdminGoogleCalendarPanel({ status }: AdminGoogleCalendarPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "1") {
      setMessage("Agenda Google connecté — les créneaux occupés d'Adam sont exclus automatiquement.");
      router.replace("/admin/creneaux");
    } else if (error) {
      setMessage(ERROR_MESSAGES[error] ?? "Erreur de connexion Google.");
      router.replace("/admin/creneaux");
    }
  }, [searchParams, router]);

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleCalendarAction();
      if (!result.ok) {
        setMessage(result.error ?? "Déconnexion impossible.");
        return;
      }
      setMessage("Agenda Google déconnecté.");
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.05] to-white/60 shadow-sm">
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarCheck className="size-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Agenda Google — Adam</h2>
          <Badge
            variant="outline"
            className={cn(
              status.connected
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                : "border-amber-500/40 bg-amber-500/10 text-amber-800"
            )}
          >
            {status.connected ? "Connecté" : "Non connecté"}
          </Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Les prospecteurs ne voient que les créneaux libres dans l&apos;agenda d&apos;Adam. Un RDV
          booké crée automatiquement un événement sur son Google Calendar.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {message ? (
          <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">{message}</p>
        ) : null}

        {status.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {status.connectedEmail ?? "Compte Google connecté"}
              </p>
              {status.connectedAt ? (
                <p className="text-xs text-muted-foreground">
                  Connecté le {new Date(status.connectedAt).toLocaleString("fr-FR")}
                </p>
              ) : null}
            </div>
            <Button variant="outline" disabled={isPending} onClick={handleDisconnect} className="gap-2">
              <Unplug className="size-4" />
              Déconnecter
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {status.googleConfigured ? (
              <Link href="/api/auth/google/calendar" className={cn(buttonVariants(), "gap-2")}>
                <Link2 className="size-4" />
                Connecter l&apos;agenda Google d&apos;Adam
              </Link>
            ) : (
              <p className="text-sm text-amber-800">
                Ajoutez <code className="rounded bg-amber-500/10 px-1">GOOGLE_CLIENT_ID</code> et{" "}
                <code className="rounded bg-amber-500/10 px-1">GOOGLE_CLIENT_SECRET</code> dans{" "}
                <code className="rounded bg-amber-500/10 px-1">.env.local</code>.
              </p>
            )}
          </div>
        )}

        {!status.syncReady ? (
          <p className="text-xs text-amber-700">
            Ajoutez aussi{" "}
            <code className="rounded bg-amber-500/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code> pour
            synchroniser l&apos;agenda côté serveur (sans exposer le token aux prospecteurs).
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
          <span>Page publique Adam :</span>
          <a
            href={status.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Target Agency — RDV Adam
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
