import { differenceInHours } from "date-fns";

import {
  computeBountyStats,
  WEEKLY_RDV_TARGET,
} from "@/lib/bounty-stats";
import type { ProspectListItem, RdvStatus } from "@/types/database.types";

export type MissionActionType =
  | "qualify_call"
  | "declare_rdv"
  | "redo_rdv"
  | "follow_up_closing"
  | "open_lead";

export type MissionItem = {
  id: string;
  prospectId: string;
  entreprise: string;
  email: string;
  ia_score: number | null;
  statut: string;
  rdv_status: RdvStatus;
  actionType: MissionActionType;
  title: string;
  reason: string;
  ctaLabel: string;
  priority: number;
};

export type MissionQueueResult = {
  items: MissionItem[];
  summary: {
    totalActions: number;
    rdvRemaining: number;
    validatedThisWeek: number;
    weeklyTarget: number;
    headline: string;
    subline: string;
  };
};

function isAValider(statut: string): boolean {
  return statut.toLowerCase().includes("valider");
}

function isApprouve(statut: string): boolean {
  const s = statut.toLowerCase();
  return s.includes("approuv") || s.includes("envoy");
}

function isConverti(statut: string): boolean {
  return statut.toLowerCase().includes("converti");
}

function canDeclareRdv(status: RdvStatus): boolean {
  return status === "NONE" || status === "REJECTED";
}

function hoursSince(iso: string): number {
  return differenceInHours(new Date(), new Date(iso));
}

function buildMission(
  prospect: ProspectListItem,
  actionType: MissionActionType,
  title: string,
  reason: string,
  ctaLabel: string,
  priority: number
): MissionItem {
  return {
    id: `${actionType}-${prospect.id}`,
    prospectId: prospect.id,
    entreprise: prospect.entreprise,
    email: prospect.email,
    ia_score: prospect.ia_score,
    statut: prospect.statut,
    rdv_status: prospect.rdv_status ?? "NONE",
    actionType,
    title,
    reason,
    ctaLabel,
    priority,
  };
}

export function computeMissionQueue(prospects: ProspectListItem[]): MissionQueueResult {
  const missions: MissionItem[] = [];
  const bounty = computeBountyStats(prospects);
  const rdvRemaining = Math.max(0, WEEKLY_RDV_TARGET - bounty.validatedThisWeek);

  for (const prospect of prospects) {
    const score = prospect.ia_score ?? 0;
    const rdvStatus = prospect.rdv_status ?? "NONE";
    const statut = prospect.statut;
    const ageHours = hoursSince(prospect.created_at);

    if (isAValider(statut) && canDeclareRdv(rdvStatus)) {
      missions.push(
        buildMission(
          prospect,
          "qualify_call",
          score >= 75 ? `Appeler ${prospect.entreprise}` : `Contacter ${prospect.entreprise}`,
          score >= 75
            ? `Lead chaud · score ${score} · qualifiez l'appel (NRP / Échange / RDV)`
            : score > 0
              ? `Score IA ${score} · en attente de qualification téléphonique`
              : "Lead à traiter — qualifiez l'issue d'appel dans le pipeline",
          "Qualifier l'appel",
          score >= 75 ? 10_000 + score : 7_000 + score
        )
      );
      continue;
    }

    if (prospect.rdv_status === "REJECTED") {
      missions.push(
        buildMission(
          prospect,
          "redo_rdv",
          `Corriger RDV — ${prospect.entreprise}`,
          "RDV rejeté · hors critères qualité · re-déclarer après correction",
          "Re-déclarer RDV",
          9_500 + score
        )
      );
      continue;
    }

    if (isApprouve(statut) && canDeclareRdv(rdvStatus) && ageHours >= 48) {
      missions.push(
        buildMission(
          prospect,
          "declare_rdv",
          `Déclarer RDV — ${prospect.entreprise}`,
          `Lead prêt depuis ${Math.floor(ageHours / 24)}j · risque de refroidissement`,
          "Déclarer RDV",
          9_000 + score
        )
      );
      continue;
    }

    if (
      rdvStatus === "VALIDATED" &&
      !isConverti(statut) &&
      prospect.rdv_date &&
      hoursSince(prospect.rdv_date) >= 24 * 7
    ) {
      missions.push(
        buildMission(
          prospect,
          "follow_up_closing",
          `Relancer closing — ${prospect.entreprise}`,
          "RDV validé · aucune conversion depuis 7+ jours",
          "Ouvrir la fiche",
          8_500 + score
        )
      );
      continue;
    }

    if (isApprouve(statut) && canDeclareRdv(rdvStatus) && score >= 60) {
      missions.push(
        buildMission(
          prospect,
          "declare_rdv",
          `Booker RDV — ${prospect.entreprise}`,
          `Score ${score} · prêt à déclarer un RDV (+1 vers l'objectif ${WEEKLY_RDV_TARGET})`,
          "Déclarer RDV",
          8_000 + score
        )
      );
      continue;
    }

    if (isApprouve(statut) && canDeclareRdv(rdvStatus)) {
      missions.push(
        buildMission(
          prospect,
          "declare_rdv",
          `Déclarer RDV — ${prospect.entreprise}`,
          "Lead contacté · prêt à être booké",
          "Déclarer RDV",
          6_000 + score
        )
      );
      continue;
    }

    if (isApprouve(statut) && rdvStatus === "PENDING") {
      missions.push(
        buildMission(
          prospect,
          "open_lead",
          `Suivre RDV — ${prospect.entreprise}`,
          "RDV en attente de validation admin · aucune action requise",
          "Voir la fiche",
          3_000
        )
      );
    }
  }

  const items = missions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);

  const highImpactCount = items.filter(
    (item) =>
      item.actionType === "qualify_call" ||
      item.actionType === "declare_rdv" ||
      item.actionType === "redo_rdv"
  ).length;

  let headline = "Pipeline à jour — continuez sur vos leads en cours.";
  let subline = `${bounty.validatedThisWeek}/${WEEKLY_RDV_TARGET} RDV validés cette semaine.`;

  if (rdvRemaining > 0 && highImpactCount > 0) {
    headline = `${highImpactCount} action${highImpactCount > 1 ? "s" : ""} prioritaire${highImpactCount > 1 ? "s" : ""} pour rapprocher les ${rdvRemaining} RDV restants.`;
    subline = "Une action = un clic. Priorité calculée sur score IA, statut et ancienneté.";
  } else if (rdvRemaining === 0) {
    headline = "Objectif hebdo atteint — maintenez le rythme ou poussez le closing.";
    subline = `Prime volume débloquée · ${bounty.validatedThisWeek} RDV validés.`;
  } else if (items.length === 0) {
    headline = "Aucune mission urgente — consultez le pipeline pour prospecter.";
    subline = "Les nouvelles assignations apparaîtront ici automatiquement.";
  }

  return {
    items,
    summary: {
      totalActions: items.length,
      rdvRemaining,
      validatedThisWeek: bounty.validatedThisWeek,
      weeklyTarget: WEEKLY_RDV_TARGET,
      headline,
      subline,
    },
  };
}
