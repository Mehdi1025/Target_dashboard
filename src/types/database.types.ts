/**
 * Schéma canonique Target OS (Supabase public)
 * Source de vérité — mettre à jour lors de chaque migration SQL.
 */

export type UserRole = "admin" | "prospecteur";

/** Statut RDV pour le système Quota & Primes */
export type RdvStatus = "NONE" | "PENDING" | "VALIDATED" | "REJECTED";

export const RDV_STATUSES = [
  "NONE",
  "PENDING",
  "VALIDATED",
  "REJECTED",
] as const satisfies readonly RdvStatus[];

/** Motif admin lors du rejet d'un RDV déclaré */
export type RdvRejectionReason = "INJOIGNABLE" | "PAS_INTERESSE" | "FAUX_NUMERO";

export const RDV_REJECTION_REASONS = [
  "INJOIGNABLE",
  "PAS_INTERESSE",
  "FAUX_NUMERO",
] as const satisfies readonly RdvRejectionReason[];

export const RDV_REJECTION_REASON_LABELS: Record<RdvRejectionReason, string> = {
  INJOIGNABLE: "Injoignable",
  PAS_INTERESSE: "Pas intéressé",
  FAUX_NUMERO: "Faux numéro",
};

/** Issue d'appel téléphonique — mise à jour du statut pipeline */
export type CallDisposition = "NRP" | "ECHANGE" | "REFUS";

export const CALL_DISPOSITIONS = [
  "NRP",
  "ECHANGE",
  "REFUS",
] as const satisfies readonly CallDisposition[];

/** Libellés persistés dans prospects.statut */
export const CALL_DISPOSITION_STATUTS: Record<CallDisposition, string> = {
  NRP: "NRP",
  ECHANGE: "Échange",
  REFUS: "Refus",
};

/** Actions tracées dans l'ECG Commercial */
export type ActionType =
  | "VIEW_LEAD"
  | "GENERATE_LINK"
  | "COPY_EMAIL"
  | "COPY_AUDIT_LINK"
  | "APPROVE_LEAD"
  | "SAVE_NOTES"
  | "OPEN_REPORT"
  | "SNIPER_ALERT"
  | "CALL_DISPOSITION";

export const ACTION_TYPES = [
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      prospector_logs: {
        Row: {
          id: string;
          profile_id: string;
          action_type: string;
          prospect_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          action_type: string;
          prospect_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          action_type?: string;
          prospect_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          prenom: string | null;
          nom: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          prenom?: string | null;
          nom?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          prenom?: string | null;
          nom?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      prospects: {
        Row: {
          id: string;
          created_at: string;
          slug: string | null;
          assigned_to: string | null;
          prenom: string | null;
          nom: string | null;
          email: string;
          poste: string | null;
          entreprise: string;
          url: string | null;
          secteur: string | null;
          taille_entreprise: string | null;
          chiffre_affaires: string | null;
          annee_creation: string | null;
          ia_score: number | null;
          analyse_site: string | null;
          forces: string | null;
          faiblesses: string | null;
          proposition_commerciale: string | null;
          script_email: string | null;
          html_rapport: string | null;
          statut: string;
          notes: string | null;
          rdv_status: RdvStatus;
          rdv_date: string | null;
          rdv_rejection_reason: RdvRejectionReason | null;
          deal_amount: number;
          commission_earned: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          slug?: string | null;
          assigned_to?: string | null;
          prenom?: string | null;
          nom?: string | null;
          email: string;
          poste?: string | null;
          entreprise: string;
          url?: string | null;
          secteur?: string | null;
          taille_entreprise?: string | null;
          chiffre_affaires?: string | null;
          annee_creation?: string | null;
          ia_score?: number | null;
          analyse_site?: string | null;
          forces?: string | null;
          faiblesses?: string | null;
          proposition_commerciale?: string | null;
          script_email?: string | null;
          html_rapport?: string | null;
          statut?: string;
          notes?: string | null;
          rdv_status?: RdvStatus;
          rdv_date?: string | null;
          rdv_rejection_reason?: RdvRejectionReason | null;
          deal_amount?: number;
          commission_earned?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          slug?: string | null;
          assigned_to?: string | null;
          prenom?: string | null;
          nom?: string | null;
          email?: string;
          poste?: string | null;
          entreprise?: string;
          url?: string | null;
          secteur?: string | null;
          taille_entreprise?: string | null;
          chiffre_affaires?: string | null;
          annee_creation?: string | null;
          ia_score?: number | null;
          analyse_site?: string | null;
          forces?: string | null;
          faiblesses?: string | null;
          proposition_commerciale?: string | null;
          script_email?: string | null;
          html_rapport?: string | null;
          statut?: string;
          notes?: string | null;
          rdv_status?: RdvStatus;
          rdv_date?: string | null;
          rdv_rejection_reason?: RdvRejectionReason | null;
          deal_amount?: number;
          commission_earned?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];
export type ProspectorLogRow = Database["public"]["Tables"]["prospector_logs"]["Row"];
export type ProspectorLogInsert = Database["public"]["Tables"]["prospector_logs"]["Insert"];

export const PROSPECT_IDENTITY_FIELDS =
  "prenom, nom, email, poste" as const;

export const PROSPECT_COMPANY_FIELDS =
  "entreprise, url, secteur, taille_entreprise, chiffre_affaires, annee_creation" as const;

export const PROSPECT_AI_CORE_FIELDS =
  "ia_score, analyse_site, forces, faiblesses, proposition_commerciale, script_email" as const;

export const PROSPECT_AI_FIELDS =
  `${PROSPECT_AI_CORE_FIELDS}, html_rapport` as const;

export const PROSPECT_TRACKING_FIELDS = "statut, notes, assigned_to" as const;

export const PROSPECT_RDV_FIELDS =
  "rdv_status, rdv_date, rdv_rejection_reason, deal_amount, commission_earned" as const;

export const PROSPECT_LIST_SELECT =
  `id, slug, created_at, assigned_to, ${PROSPECT_IDENTITY_FIELDS}, entreprise, ia_score, statut, notes, ${PROSPECT_RDV_FIELDS}`;

/** Chargement initial fiche prospect — sans html_rapport (lazy) */
export const PROSPECT_DETAIL_SELECT =
  `id, slug, created_at, assigned_to, ${PROSPECT_IDENTITY_FIELDS}, ${PROSPECT_COMPANY_FIELDS}, ${PROSPECT_AI_CORE_FIELDS}, statut, notes, ${PROSPECT_RDV_FIELDS}`;

/** Données pour la Salle de Briefing (sans html_rapport) */
export const PROSPECT_BRIEFING_SELECT =
  `id, slug, created_at, assigned_to, ${PROSPECT_IDENTITY_FIELDS}, entreprise, url, secteur, ia_score, analyse_site, forces, faiblesses, proposition_commerciale, script_email, statut, notes, ${PROSPECT_RDV_FIELDS}`;

export const PROSPECT_REPORT_SELECT = "html_rapport" as const;

export type ProspectListItem = Pick<
  ProspectRow,
  | "id"
  | "slug"
  | "created_at"
  | "assigned_to"
  | "prenom"
  | "nom"
  | "email"
  | "poste"
  | "entreprise"
  | "ia_score"
  | "statut"
  | "notes"
  | "rdv_status"
  | "rdv_date"
  | "rdv_rejection_reason"
  | "deal_amount"
  | "commission_earned"
>;

export type ProspectDetail = ProspectRow;

export type ProspectDetailCore = Omit<ProspectRow, "html_rapport">;

export type BriefingProspect = Pick<
  ProspectRow,
  | "id"
  | "slug"
  | "created_at"
  | "assigned_to"
  | "prenom"
  | "nom"
  | "email"
  | "poste"
  | "entreprise"
  | "url"
  | "secteur"
  | "ia_score"
  | "analyse_site"
  | "forces"
  | "faiblesses"
  | "proposition_commerciale"
  | "script_email"
  | "statut"
  | "notes"
  | "rdv_status"
  | "rdv_date"
  | "rdv_rejection_reason"
  | "deal_amount"
  | "commission_earned"
>;

export type OrphanProspectItem = Pick<
  ProspectRow,
  "id" | "entreprise" | "email" | "ia_score" | "statut" | "created_at"
>;
