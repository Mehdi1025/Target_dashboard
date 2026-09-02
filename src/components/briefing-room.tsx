"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { openRdvBookingUrl } from "@/lib/rdv-booking-url";
import { AuditLinkActions } from "@/components/audit-link-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTrackActivity } from "@/hooks/use-track-activity";
import {
  getBriefingAngle,
  orderBriefingProspects,
  parseBriefingBullets,
} from "@/lib/briefing-utils";
import { getFullName } from "@/lib/prospect-utils";
import { canDeclareRdvFromStatus, getRdvBadgeClass, RDV_STATUS_LABELS } from "@/lib/rdv-utils";
import { cn } from "@/lib/utils";
import type { BriefingProspect } from "@/types/prospect";
import type { RdvStatus } from "@/types/database.types";

type BriefingRoomProps = {
  prospects: BriefingProspect[];
};

type ChecklistState = {
  reportRead: boolean;
  questionsReady: boolean;
  auditTested: boolean;
};

const DEFAULT_CHECKLIST: ChecklistState = {
  reportRead: false,
  questionsReady: false,
  auditTested: false,
};

function checklistKey(prospectId: string) {
  return `target-os-briefing-${prospectId}`;
}

function loadChecklist(prospectId: string): ChecklistState {
  if (typeof window === "undefined") return DEFAULT_CHECKLIST;
  try {
    const raw = window.localStorage.getItem(checklistKey(prospectId));
    if (!raw) return DEFAULT_CHECKLIST;
    return { ...DEFAULT_CHECKLIST, ...JSON.parse(raw) } as ChecklistState;
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

function saveChecklist(prospectId: string, state: ChecklistState) {
  window.localStorage.setItem(checklistKey(prospectId), JSON.stringify(state));
}

const CHECKLIST_ITEMS: {
  key: keyof ChecklistState;
  label: string;
}[] = [
  { key: "reportRead", label: "Rapport IA parcouru" },
  { key: "questionsReady", label: "3 questions de découverte prêtes" },
  { key: "auditTested", label: "Lien audit testé / prêt à partager" },
];

export function BriefingRoom({ prospects: initialProspects }: BriefingRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { logAction } = useTrackActivity();
  const [prospects, setProspects] = useState(initialProspects);
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_CHECKLIST);

  useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  const ordered = useMemo(() => orderBriefingProspects(prospects), [prospects]);

  const selectedId = searchParams.get("id");
  const currentIndex = useMemo(() => {
    if (ordered.length === 0) return -1;
    if (selectedId) {
      const index = ordered.findIndex((p) => p.id === selectedId);
      return index >= 0 ? index : 0;
    }
    return 0;
  }, [ordered, selectedId]);

  const current = currentIndex >= 0 ? ordered[currentIndex] : null;

  useEffect(() => {
    if (!current) return;
    setChecklist(loadChecklist(current.id));
  }, [current?.id]);

  const goToIndex = useCallback(
    (index: number) => {
      const next = ordered[index];
      if (!next) return;
      router.replace(`/prospecteur/briefing?id=${next.id}`, { scroll: false });
    },
    [ordered, router]
  );

  function updateChecklist(key: keyof ChecklistState, value: boolean) {
    if (!current) return;
    const next = { ...checklist, [key]: value };
    setChecklist(next);
    saveChecklist(current.id, next);
  }

  function patchProspect(id: string, patch: Partial<BriefingProspect>) {
    setProspects((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function copyScript() {
    if (!current?.script_email?.trim()) {
      toast({
        variant: "warning",
        title: "Script indisponible",
        description: "Aucun script email généré pour ce lead.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(current.script_email);
      logAction("COPY_EMAIL", current.id, {
        entreprise: current.entreprise,
        source: "briefing_room",
      });
      toast({
        variant: "success",
        title: "Script copié",
        description: "Collez-le dans votre client mail ou LinkedIn.",
      });
    } catch {
      toast({ variant: "error", title: "Copie impossible" });
    }
  }

  async function copyContactEmail() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.email);
      logAction("COPY_EMAIL", current.id, {
        entreprise: current.entreprise,
        source: "briefing_contact",
      });
      toast({ variant: "success", title: "Email copié", description: current.email });
    } catch {
      toast({ variant: "error", title: "Copie impossible" });
    }
  }

  if (ordered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-white/40 px-6 py-16 text-center">
        <BookOpen className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-semibold">Aucun lead à briefinger</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les leads approuvés ou à valider apparaîtront ici automatiquement.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          Retour au pipeline
        </Link>
      </div>
    );
  }

  if (!current) return null;

  const forces = parseBriefingBullets(current.forces);
  const faiblesses = parseBriefingBullets(current.faiblesses);
  const angle = getBriefingAngle(current);
  const rdvStatus = (current.rdv_status ?? "NONE") as RdvStatus;
  const canDeclare = canDeclareRdvFromStatus(rdvStatus);
  const checklistDone = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={currentIndex <= 0}
            onClick={() => goToIndex(currentIndex - 1)}
            aria-label="Lead précédent"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-mono tabular-nums">
            {currentIndex + 1} / {ordered.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={currentIndex >= ordered.length - 1}
            onClick={() => goToIndex(currentIndex + 1)}
            aria-label="Lead suivant"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {checklistDone ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
            <Check className="size-3" />
            Prêt pour le RDV
          </Badge>
        ) : null}
      </div>

      <article className="relative overflow-hidden rounded-[1.75rem] border border-indigo-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-[0_0_80px_-24px_rgba(99,102,241,0.55)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.2), transparent 40%)",
          }}
        />

        <div className="relative space-y-8 p-6 lg:p-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
                <BookOpen className="size-3.5" />
                Salle de Briefing
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
                {current.entreprise}
              </h2>
              <p className="text-sm text-slate-400">
                {getFullName(current.prenom, current.nom)}
                {current.poste ? ` · ${current.poste}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/20 bg-white/5 text-white">
                  {current.statut}
                </Badge>
                {rdvStatus !== "NONE" ? (
                  <Badge
                    variant="outline"
                    className={cn("font-semibold", getRdvBadgeClass(rdvStatus))}
                  >
                    RDV · {RDV_STATUS_LABELS[rdvStatus]}
                  </Badge>
                ) : null}
              </div>
            </div>
            {current.ia_score !== null ? (
              <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Score IA
                </span>
                <span className="font-mono text-4xl font-black tabular-nums text-indigo-100">
                  {current.ia_score}
                </span>
              </div>
            ) : null}
          </header>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="size-3.5" />
              Angle d&apos;approche IA
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-200">{angle}</p>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <BriefingListCard
              title="Forces clés"
              icon={TrendingUp}
              items={forces}
              empty="Aucune force analysée."
              tone="emerald"
            />
            <BriefingListCard
              title="Faiblesses à exploiter"
              icon={TrendingDown}
              items={faiblesses}
              empty="Aucune faiblesse analysée."
              tone="amber"
            />
          </div>

          {current.proposition_commerciale?.trim() ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Proposition commerciale
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {current.proposition_commerciale}
              </p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Actions rapides
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={copyScript}
              >
                <Copy className="size-3.5" />
                Copier script email
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={copyContactEmail}
              >
                <Mail className="size-3.5" />
                Copier email contact
              </Button>
              <div className="[&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-white [&_button]:hover:bg-white/10">
                <AuditLinkActions
                  prospectId={current.id}
                  entreprise={current.entreprise}
                  slug={current.slug}
                  variant="inline"
                />
              </div>
              <Link
                href={`/prospects/${current.id}`}
                prefetch
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/20 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <ExternalLink className="size-3.5" />
                Fiche complète
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              <Target className="size-3.5" />
              Checklist avant RDV
            </p>
            <ul className="mt-4 space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition-colors hover:bg-black/30">
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={(event) => updateChecklist(item.key, event.target.checked)}
                      className="size-4 rounded border-white/30 bg-transparent accent-indigo-500"
                    />
                    <span
                      className={cn(
                        "text-sm",
                        checklist[item.key] ? "text-indigo-100 line-through opacity-70" : "text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                disabled={currentIndex <= 0}
                onClick={() => goToIndex(currentIndex - 1)}
              >
                <ArrowLeft className="size-3.5" />
                Précédent
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                disabled={currentIndex >= ordered.length - 1}
                onClick={() => goToIndex(currentIndex + 1)}
              >
                Suivant
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
            {canDeclare ? (
              <Button
                type="button"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                onClick={() => openRdvBookingUrl()}
              >
                <ExternalLink className="size-3.5" />
                Réserver sur Google Calendar
              </Button>
            ) : (
              <p className="text-xs text-slate-400">
                RDV déjà déclaré ou en cours de validation.
              </p>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
}

function BriefingListCard({
  title,
  icon: Icon,
  items,
  empty,
  tone,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: string[];
  empty: string;
  tone: "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : "border-amber-500/20 bg-amber-500/10 text-amber-200";

  return (
    <section className={cn("rounded-2xl border p-5", toneClass)}>
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
        <Icon className="size-3.5" />
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm opacity-70">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed">
              <span className="opacity-50">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
