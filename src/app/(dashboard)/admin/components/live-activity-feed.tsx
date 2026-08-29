"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Link2,
  Mail,
  Radio,
  StickyNote,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { cn } from "@/lib/utils";
import type {
  ActivityMetadata,
  ProfileLookup,
  ProspectActivityLogEnriched,
  ProspectActivityLogRow,
} from "@/types/activity.types";
import { getActionLabel, getActionVisual, isActionType } from "@/types/activity.types";
import type { ActionType, ProfileRow } from "@/types/database.types";

type LiveActivityFeedProps = {
  prospecteurs: ProfileRow[];
};

const MAX_LOGS = 50;

const LOG_SELECT = `
  id,
  profile_id,
  action_type,
  prospect_id,
  metadata,
  created_at,
  profiles:profile_id ( prenom, nom, email ),
  prospects:prospect_id ( entreprise )
`;

type LogQueryRow = {
  id: string;
  profile_id: string;
  action_type: string;
  prospect_id: string | null;
  metadata: ActivityMetadata | null;
  created_at: string;
  profiles: {
    prenom: string | null;
    nom: string | null;
    email: string;
  } | null;
  prospects: {
    entreprise: string;
  } | null;
};

const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  VIEW_LEAD: Eye,
  GENERATE_LINK: Link2,
  COPY_EMAIL: Mail,
  COPY_AUDIT_LINK: Copy,
  APPROVE_LEAD: CheckCircle2,
  SAVE_NOTES: StickyNote,
  OPEN_REPORT: FileText,
  SNIPER_ALERT: AlertTriangle,
};

function buildProfileLookup(prospecteurs: ProfileRow[]): ProfileLookup {
  return Object.fromEntries(
    prospecteurs.map((profile) => [
      profile.id,
      { prenom: profile.prenom, nom: profile.nom, email: profile.email },
    ])
  );
}

function normalizeRow(row: LogQueryRow, profileLookup: ProfileLookup): ProspectActivityLogEnriched {
  if (row.profiles) {
    profileLookup[row.profile_id] = row.profiles;
  }

  const metadata = (row.metadata ?? {}) as ActivityMetadata;
  const entreprise = row.prospects?.entreprise ?? metadata.entreprise ?? null;
  const profile = profileLookup[row.profile_id];

  const prospecteurName = profile
    ? getProfileDisplayName({
        id: row.profile_id,
        email: profile.email,
        role: "prospecteur",
        prenom: profile.prenom,
        nom: profile.nom,
        created_at: "",
      })
    : "Prospecteur";

  return {
    id: row.id,
    profile_id: row.profile_id,
    action_type: row.action_type,
    prospect_id: row.prospect_id,
    metadata: { ...metadata, entreprise: entreprise ?? undefined },
    created_at: row.created_at,
    prospecteurName,
    entreprise,
  };
}

function enrichFromPayload(
  row: ProspectActivityLogRow,
  profileLookup: ProfileLookup
): ProspectActivityLogEnriched {
  const metadata = (row.metadata ?? {}) as ActivityMetadata;
  const profile = profileLookup[row.profile_id];

  return {
    ...row,
    metadata,
    prospecteurName: profile
      ? getProfileDisplayName({
          id: row.profile_id,
          email: profile.email,
          role: "prospecteur",
          prenom: profile.prenom,
          nom: profile.nom,
          created_at: "",
        })
      : "Prospecteur",
    entreprise: metadata.entreprise ?? null,
  };
}

function formatLogTime(iso: string): { relative: string; clock: string } {
  const date = new Date(iso);
  return {
    relative: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
    clock: format(date, "HH:mm:ss"),
  };
}

function getIcon(actionType: string): LucideIcon {
  if (isActionType(actionType)) {
    return ACTION_ICONS[actionType];
  }
  return Activity;
}

export function LiveActivityFeed({ prospecteurs }: LiveActivityFeedProps) {
  const [logs, setLogs] = useState<ProspectActivityLogEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  const profileLookup = useMemo(() => buildProfileLookup(prospecteurs), [prospecteurs]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchLogById(logId: string) {
      const { data } = await supabase
        .from("prospector_logs")
        .select(LOG_SELECT)
        .eq("id", logId)
        .maybeSingle();

      if (!data || !isMounted) return null;

      const lookup = buildProfileLookup(prospecteurs);
      return normalizeRow(data as LogQueryRow, lookup);
    }

    async function loadInitialLogs() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("prospector_logs")
        .select(LOG_SELECT)
        .order("created_at", { ascending: false })
        .limit(MAX_LOGS);

      if (!isMounted) return;

      if (error) {
        console.error("[LiveActivityFeed] initial load:", error.message);
        setLogs([]);
        setIsLoading(false);
        return;
      }

      const lookup = buildProfileLookup(prospecteurs);
      setLogs(((data ?? []) as LogQueryRow[]).map((row) => normalizeRow(row, lookup)));
      setIsLoading(false);
    }

    void loadInitialLogs();

    const channel = supabase
      .channel("ecg-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prospector_logs" },
        (payload) => {
          if (!isMounted) return;

          void (async () => {
            const inserted = payload.new as ProspectActivityLogRow;
            const enriched =
              (await fetchLogById(inserted.id)) ??
              enrichFromPayload(inserted, buildProfileLookup(prospecteurs));

            setLogs((current) => {
              if (current.some((item) => item.id === enriched.id)) return current;
              return [enriched, ...current].slice(0, MAX_LOGS);
            });

            setRecentIds((current) => new Set(current).add(enriched.id));
            window.setTimeout(() => {
              setRecentIds((current) => {
                const next = new Set(current);
                next.delete(enriched.id);
                return next;
              });
            }, 2600);
          })();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsLive(true);
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [prospecteurs]);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-800/90 bg-[#09090b] text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]">
      <div className="relative overflow-hidden border-b border-white/[0.08] px-6 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Activity className="size-5 text-emerald-400" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400/90">
                ECG Commercial
              </p>
              <h2 className="text-lg font-bold tracking-tight text-white">Live Activity Feed</h2>
              <p className="text-xs text-zinc-500">Pulse temps réel des micro-actions commerciales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex size-2">
              {isLive ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </>
              ) : (
                <span className="relative inline-flex size-2 rounded-full bg-zinc-600" />
              )}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {isLive ? "Live" : "Sync…"}
            </span>
            <Radio className="size-3.5 text-zinc-500" />
          </div>
        </div>
      </div>

      <div className="relative max-h-[560px] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="pointer-events-none absolute bottom-4 left-[1.85rem] top-4 w-px bg-gradient-to-b from-emerald-500/50 via-zinc-700/40 to-transparent sm:left-[2.15rem]" />

        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-4 rounded-xl bg-zinc-900/40 p-3 pl-10">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-zinc-900" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <Zap className="size-7 text-zinc-600" />
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-300">Signal plat — en attente d&apos;activité</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-600">
              Dès qu&apos;un prospecteur consulte un lead, copie un email ou génère un lien, l&apos;événement
              apparaît ici instantanément.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => {
              const visual = getActionVisual(log.action_type);
              const Icon = getIcon(log.action_type);
              const isRecent = recentIds.has(log.id);
              const time = formatLogTime(log.created_at);
              const actionCode = isActionType(log.action_type)
                ? log.action_type
                : log.action_type.toUpperCase();

              return (
                <li
                  key={log.id}
                  className={cn(
                    "group relative flex gap-3 rounded-xl border border-transparent px-2 py-3 transition-all duration-500 sm:gap-4 sm:px-3",
                    isRecent
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                      : "hover:border-zinc-800 hover:bg-zinc-900/40"
                  )}
                >
                  <div className="relative z-10 mt-0.5 flex w-8 shrink-0 flex-col items-center gap-2 sm:w-9">
                    <span
                      className={cn(
                        "size-2.5 rounded-full ring-2 ring-[#09090b]",
                        visual.dotClass,
                        isRecent && "animate-pulse"
                      )}
                    />
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border bg-zinc-950/80",
                        visual.badgeClass,
                        visual.ringClass,
                        "ring-1"
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-100">{log.prospecteurName}</span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                          visual.badgeClass
                        )}
                      >
                        {actionCode}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-zinc-400">{getActionLabel(log.action_type)}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {log.entreprise ? (
                        <span className="font-medium text-zinc-200">{log.entreprise}</span>
                      ) : null}
                      <span className="text-zinc-500">{time.relative}</span>
                      <span className="font-mono text-zinc-600">{time.clock}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
