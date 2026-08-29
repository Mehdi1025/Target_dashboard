import type { RdvStatus } from "@/types/database.types";

export const RDV_STATUS_LABELS: Record<RdvStatus, string> = {
  NONE: "Aucun RDV",
  PENDING: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
};

export function getRdvBadgeClass(status: RdvStatus): string {
  switch (status) {
    case "PENDING":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700";
    case "VALIDATED":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700";
    case "REJECTED":
      return "border-rose-500/40 bg-rose-500/10 text-rose-700";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

export function canDeclareRdvFromStatus(status: RdvStatus): boolean {
  return status === "NONE" || status === "REJECTED";
}
