import type { ActionType, CallDisposition } from "@/types/database.types";
import type { Json } from "@/types/database.types";

export type { ActionType };

/** @deprecated Utiliser ActionType depuis database.types */
export type ProspectActionType = ActionType;

export const PROSPECT_ACTION_TYPES = [
  "VIEW_LEAD",
  "GENERATE_LINK",
  "COPY_EMAIL",
  "COPY_AUDIT_LINK",
  "APPROVE_LEAD",
  "SAVE_NOTES",
  "OPEN_REPORT",
  "SNIPER_ALERT",
  "CALL_DISPOSITION",
] as const satisfies readonly ActionType[];

export type ActivityMetadata = {
  entreprise?: string;
  email_type?: string;
  slug?: string;
  statut?: string;
  disposition?: CallDisposition;
  notes_length?: number;
  source?: string;
  [key: string]: Json | undefined;
};

export type ProspectActivityLogRow = {
  id: string;
  profile_id: string;
  action_type: ActionType | string;
  prospect_id: string | null;
  metadata: ActivityMetadata;
  created_at: string;
};

export type ProspectActivityLogEnriched = ProspectActivityLogRow & {
  prospecteurName: string;
  entreprise: string | null;
};

export type ProfileLookup = Record<
  string,
  { prenom: string | null; nom: string | null; email: string }
>;

export function isActionType(value: string): value is ActionType {
  return (PROSPECT_ACTION_TYPES as readonly string[]).includes(value);
}

/** @deprecated Utiliser isActionType */
export const isProspectActionType = isActionType;

export function getActionLabel(actionType: string): string {
  const labels: Record<ActionType, string> = {
    VIEW_LEAD: "Consultation fiche lead",
    GENERATE_LINK: "Génération lien audit",
    COPY_EMAIL: "Copie script email",
    COPY_AUDIT_LINK: "Copie lien client",
    APPROVE_LEAD: "Approbation lead",
    SAVE_NOTES: "Enregistrement notes",
    OPEN_REPORT: "Ouverture rapport brand",
    SNIPER_ALERT: "Alerte sniper (faiblesses)",
    CALL_DISPOSITION: "Issue d'appel téléphonique",
  };

  if (isActionType(actionType)) {
    return labels[actionType];
  }

  return actionType.replaceAll("_", " ").toLowerCase();
}

export type ActionVisualConfig = {
  dotClass: string;
  badgeClass: string;
  ringClass: string;
};

export function getActionVisual(actionType: string): ActionVisualConfig {
  switch (actionType) {
    case "APPROVE_LEAD":
    case "VIEW_LEAD":
      return {
        dotClass: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]",
        badgeClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        ringClass: "ring-emerald-500/30",
      };
    case "GENERATE_LINK":
    case "OPEN_REPORT":
      return {
        dotClass: "bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.65)]",
        badgeClass: "border-sky-400/30 bg-sky-500/10 text-sky-300",
        ringClass: "ring-sky-500/30",
      };
    case "COPY_EMAIL":
    case "COPY_AUDIT_LINK":
      return {
        dotClass: "bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.65)]",
        badgeClass: "border-amber-400/30 bg-amber-500/10 text-amber-200",
        ringClass: "ring-amber-500/30",
      };
    case "SNIPER_ALERT":
      return {
        dotClass: "bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.75)]",
        badgeClass: "border-rose-400/30 bg-rose-500/10 text-rose-300",
        ringClass: "ring-rose-500/40",
      };
    case "SAVE_NOTES":
      return {
        dotClass: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.55)]",
        badgeClass: "border-violet-400/30 bg-violet-500/10 text-violet-300",
        ringClass: "ring-violet-500/30",
      };
    case "CALL_DISPOSITION":
      return {
        dotClass: "bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.65)]",
        badgeClass: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
        ringClass: "ring-cyan-500/30",
      };
    default:
      return {
        dotClass: "bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.4)]",
        badgeClass: "border-zinc-600 bg-zinc-800/80 text-zinc-400",
        ringClass: "ring-zinc-600/30",
      };
  }
}
