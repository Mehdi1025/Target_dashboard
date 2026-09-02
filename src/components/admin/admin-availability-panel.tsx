"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

import {
  createRdvAvailabilityRule,
  deleteRdvAvailabilityRule,
  toggleRdvAvailabilityRule,
} from "@/app/actions/rdv-availability-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeValue, getDayLabel } from "@/lib/rdv-slots";
import { cn } from "@/lib/utils";
import type { RdvAvailabilityRuleRow } from "@/types/database.types";

type AdminAvailabilityPanelProps = {
  initialRules: RdvAvailabilityRuleRow[];
};

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((value) => ({
  value,
  label: getDayLabel(value),
}));

export function AdminAvailabilityPanel({ initialRules }: AdminAvailabilityPanelProps) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [duration, setDuration] = useState(30);
  const [label, setLabel] = useState("");

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  function refresh() {
    router.refresh();
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createRdvAvailabilityRule({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: duration,
        label: label.trim() || null,
      });

      if (!result.ok) {
        setError(result.error ?? "Création impossible.");
        return;
      }

      refresh();
    });
  }

  function handleToggle(ruleId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleRdvAvailabilityRule(ruleId, isActive);
      if (!result.ok) {
        setError(result.error ?? "Mise à jour impossible.");
        return;
      }
      setRules((current) =>
        current.map((rule) => (rule.id === ruleId ? { ...rule, is_active: isActive } : rule))
      );
      refresh();
    });
  }

  function handleDelete(ruleId: string) {
    startTransition(async () => {
      const result = await deleteRdvAvailabilityRule(ruleId);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setRules((current) => current.filter((rule) => rule.id !== ruleId));
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-white/60 shadow-sm">
        <div className="border-b border-border/60 bg-gradient-to-r from-violet-500/[0.06] to-transparent px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700/80">
            Nouvelle plage
          </p>
          <h2 className="mt-1 text-lg font-bold">Plages proposées aux prospecteurs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fenêtres horaires maximales. Les créneaux réellement bookables excluent les réunions déjà
            présentes dans l&apos;agenda Google d&apos;Adam.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Jour</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Début</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Fin</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Durée créneau</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            >
              {[15, 30, 45, 60, 90, 120].map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Libellé (opt.)</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Matin"
              className="h-10 w-full rounded-xl border border-border bg-background px-3"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
          <Button onClick={handleCreate} loading={isPending} disabled={isPending} className="gap-2">
            <Plus className="size-4" />
            Ajouter la plage
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-white/50">
        <div className="border-b border-border/60 px-6 py-5">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-violet-600" />
            <h2 className="text-lg font-bold">Plages configurées</h2>
            <Badge variant="outline">{rules.length}</Badge>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucune plage — les prospecteurs ne pourront pas réserver de RDV.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Jour</th>
                  <th className="px-4 py-3">Horaires</th>
                  <th className="px-4 py-3">Créneaux</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4 font-medium">{getDayLabel(rule.day_of_week)}</td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground">
                      {formatTimeValue(rule.start_time)} – {formatTimeValue(rule.end_time)}
                      {rule.label ? (
                        <span className="ml-2 text-xs text-foreground/70">({rule.label})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">{rule.slot_duration_minutes} min</td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          rule.is_active
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {rule.is_active ? "Active" : "Désactivée"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleToggle(rule.id, !rule.is_active)}
                        >
                          {rule.is_active ? "Désactiver" : "Activer"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
