import {
  CALL_DISPOSITION_STATUTS,
  type ProspectListItem,
  type RdvStatus,
} from "@/types/database.types";

export type MaJourneeCallDisposition = "NRP" | "ECHANGE";

export type MaJourneeActionType =
  | "a_valider"
  | "rdv_pending"
  | "approuve_sans_rdv"
  | "rdv_rejected";

export type MaJourneeItem = {
  id: string;
  entreprise: string;
  ia_score: number | null;
  statut: string;
  rdv_status: RdvStatus;
  type: MaJourneeActionType;
  priority: number;
  /** Pastille de relance dans la colonne « Sans RDV » */
  callDisposition: MaJourneeCallDisposition | null;
};

export type MaJourneeStats = {
  aValider: MaJourneeItem[];
  rdvEnAttente: MaJourneeItem[];
  approuvesSansRdv: MaJourneeItem[];
  rdvRejetes: MaJourneeItem[];
  totals: {
    aValider: number;
    rdvEnAttente: number;
    approuvesSansRdv: number;
    rdvRejetes: number;
  };
};

function normalizeStatut(statut: string): string {
  return statut.trim().toLowerCase();
}

/** Lead archivé via qualification REFUS — exclu de Ma Journée */
export function isRefusQualification(statut: string): boolean {
  const normalized = normalizeStatut(statut);
  return (
    normalized === normalizeStatut(CALL_DISPOSITION_STATUTS.REFUS) ||
    normalized.includes("refus")
  );
}

function isNrpQualification(statut: string): boolean {
  return normalizeStatut(statut) === normalizeStatut(CALL_DISPOSITION_STATUTS.NRP);
}

function isEchangeQualification(statut: string): boolean {
  const normalized = normalizeStatut(statut);
  const echangeLabel = normalizeStatut(CALL_DISPOSITION_STATUTS.ECHANGE);
  return (
    normalized === echangeLabel ||
    normalized.includes("echange") ||
    normalized.includes("échange")
  );
}

export function getCallDispositionFromStatut(
  statut: string
): MaJourneeCallDisposition | null {
  if (isNrpQualification(statut)) return "NRP";
  if (isEchangeQualification(statut)) return "ECHANGE";
  return null;
}

function isAValider(statut: string): boolean {
  return statut.toLowerCase().includes("valider");
}

function isApprouve(statut: string): boolean {
  const s = statut.toLowerCase();
  return s.includes("approuv") || s.includes("envoy");
}

function canDeclareRdv(status: RdvStatus): boolean {
  return status === "NONE" || status === "REJECTED";
}

function isActiveForMaJournee(prospect: ProspectListItem): boolean {
  return !isRefusQualification(prospect.statut);
}

function isSansRdvCandidate(prospect: ProspectListItem): boolean {
  const disposition = getCallDispositionFromStatut(prospect.statut);
  return (
    isApprouve(prospect.statut) ||
    disposition === "NRP" ||
    disposition === "ECHANGE"
  );
}

function toItem(
  prospect: ProspectListItem,
  type: MaJourneeActionType,
  priority: number
): MaJourneeItem {
  return {
    id: prospect.id,
    entreprise: prospect.entreprise,
    ia_score: prospect.ia_score,
    statut: prospect.statut,
    rdv_status: prospect.rdv_status ?? "NONE",
    type,
    priority,
    callDisposition: getCallDispositionFromStatut(prospect.statut),
  };
}

export function computeMaJournee(prospects: ProspectListItem[]): MaJourneeStats {
  const activeProspects = prospects.filter(isActiveForMaJournee);

  const aValiderAll = activeProspects
    .filter((p) => isAValider(p.statut))
    .sort((a, b) => (b.ia_score ?? 0) - (a.ia_score ?? 0))
    .map((p, index) => toItem(p, "a_valider", (p.ia_score ?? 0) * 100 - index));

  const rdvEnAttenteAll = activeProspects
    .filter((p) => p.rdv_status === "PENDING")
    .sort((a, b) => {
      const dateA = a.rdv_date ? new Date(a.rdv_date).getTime() : 0;
      const dateB = b.rdv_date ? new Date(b.rdv_date).getTime() : 0;
      return dateB - dateA;
    })
    .map((p, index) => toItem(p, "rdv_pending", 1000 - index));

  const approuvesSansRdvAll = activeProspects
    .filter(
      (p) =>
        isSansRdvCandidate(p) && canDeclareRdv(p.rdv_status ?? "NONE")
    )
    .sort((a, b) => {
      const dispositionA = getCallDispositionFromStatut(a.statut);
      const dispositionB = getCallDispositionFromStatut(b.statut);
      const relanceBoost = (d: MaJourneeCallDisposition | null) =>
        d === "NRP" ? 2 : d === "ECHANGE" ? 1 : 0;
      const scoreA = (a.ia_score ?? 0) * 100 + relanceBoost(dispositionA) * 50;
      const scoreB = (b.ia_score ?? 0) * 100 + relanceBoost(dispositionB) * 50;
      return scoreB - scoreA;
    })
    .map((p, index) => toItem(p, "approuve_sans_rdv", (p.ia_score ?? 0) * 100 - index));

  const rdvRejetesAll = activeProspects
    .filter((p) => p.rdv_status === "REJECTED")
    .map((p, index) => toItem(p, "rdv_rejected", 500 - index));

  return {
    aValider: aValiderAll.slice(0, 3),
    rdvEnAttente: rdvEnAttenteAll.slice(0, 3),
    approuvesSansRdv: approuvesSansRdvAll.slice(0, 3),
    rdvRejetes: rdvRejetesAll.slice(0, 5),
    totals: {
      aValider: aValiderAll.length,
      rdvEnAttente: rdvEnAttenteAll.length,
      approuvesSansRdv: approuvesSansRdvAll.length,
      rdvRejetes: rdvRejetesAll.length,
    },
  };
}
