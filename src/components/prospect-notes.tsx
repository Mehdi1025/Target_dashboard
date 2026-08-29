"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTrackActivity } from "@/hooks/use-track-activity";
import { cn } from "@/lib/utils";

type ProspectNotesProps = {
  prospectId: string;
  initialNotes: string | null;
  entreprise?: string;
};

export function ProspectNotes({ prospectId, initialNotes, entreprise }: ProspectNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const { logAction } = useTrackActivity();

  const isDirty = notes !== savedNotes;

  async function handleSave() {
    const nextNotes = notes.trim();
    const previousNotes = savedNotes;

    setSavedNotes(nextNotes);
    setFeedback({ type: "success", message: "Enregistré" });
    setIsSaving(true);

    try {
      const response = await fetch(`/api/prospects/${prospectId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: nextNotes || null }),
      });

      const payload = (await response.json()) as { notes?: string | null; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de sauvegarder les notes.");
      }

      const confirmed = payload.notes ?? "";
      setNotes(confirmed);
      setSavedNotes(confirmed);
      logAction("SAVE_NOTES", prospectId, {
        entreprise,
        notes_length: confirmed.length,
      });
    } catch (saveError) {
      setSavedNotes(previousNotes);
      setFeedback({
        type: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : "Impossible de sauvegarder les notes.",
      });
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setFeedback(null), 1500);
    }
  }

  return (
    <section className="bento-shine overflow-hidden rounded-[1.75rem] border border-amber-500/15 bg-gradient-to-br from-amber-50/80 via-white/60 to-white/40 shadow-sm ring-1 ring-amber-500/10">
      <div className="flex flex-col gap-4 border-b border-amber-500/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20">
            <StickyNote className="size-5" />
          </div>
          <div>
            <p className="section-eyebrow text-amber-600/70">Terrain</p>
            <h2 className="text-lg font-bold tracking-tight">Notes prospecteur</h2>
          </div>
        </div>
        <Button
          onClick={handleSave}
          loading={isSaving}
          disabled={!isDirty && !isSaving}
          variant={isDirty ? "default" : "outline"}
          className={cn(!isDirty && "bg-white/80")}
        >
          {isDirty ? "Enregistrer" : "Enregistré"}
        </Button>
      </div>
      <div className="p-6 lg:p-8">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex. : Appelé le 28/08, intéressé par refonte SEO. Rappeler mardi 10h."
          rows={4}
          className={cn(
            "w-full resize-y rounded-xl border-0 bg-white/90 px-5 py-4 ring-1 ring-amber-500/10",
            "text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70",
            "transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
          )}
        />
        {feedback ? (
          <p
            className={cn(
              "mt-3 text-xs font-semibold",
              feedback.type === "success" ? "text-emerald-600" : "text-destructive"
            )}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
