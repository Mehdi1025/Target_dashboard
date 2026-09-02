import type { BriefingProspect, RdvStatus } from "@/types/database.types";

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

function isAValider(statut: string): boolean {
  return statut.toLowerCase().includes("valider");
}

function briefingPriority(prospect: BriefingProspect): number {
  const score = prospect.ia_score ?? 0;
  const rdvStatus = prospect.rdv_status ?? "NONE";
  const statut = prospect.statut;

  if (isApprouve(statut) && canDeclareRdv(rdvStatus)) {
    return 10_000 + score;
  }

  if (rdvStatus === "REJECTED") {
    return 9_500 + score;
  }

  if (rdvStatus === "VALIDATED" && !isConverti(statut)) {
    return 9_000 + score;
  }

  if (isAValider(statut) && score >= 75) {
    return 8_500 + score;
  }

  if (isApprouve(statut)) {
    return 7_000 + score;
  }

  if (isAValider(statut)) {
    return 6_000 + score;
  }

  return score;
}

export function orderBriefingProspects(prospects: BriefingProspect[]): BriefingProspect[] {
  return [...prospects]
    .filter((prospect) => {
      const rdvStatus = prospect.rdv_status ?? "NONE";
      return (
        isAValider(prospect.statut) ||
        isApprouve(prospect.statut) ||
        rdvStatus === "REJECTED" ||
        rdvStatus === "VALIDATED"
      );
    })
    .sort((a, b) => briefingPriority(b) - briefingPriority(a));
}

export function parseBriefingBullets(text: string | null, limit = 4): string[] {
  if (!text?.trim()) return [];

  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function getBriefingAngle(prospect: BriefingProspect): string {
  const proposition = prospect.proposition_commerciale?.trim();
  if (proposition) {
    const firstSentence = proposition.split(/(?<=[.!?])\s+/)[0];
    return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}…` : firstSentence;
  }

  const analyse = prospect.analyse_site?.trim();
  if (analyse) {
    return analyse.length > 180 ? `${analyse.slice(0, 177)}…` : analyse;
  }

  return "Préparez votre approche en vous appuyant sur les forces et faiblesses identifiées par l'IA.";
}
