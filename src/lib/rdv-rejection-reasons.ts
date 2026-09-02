import type { RdvRejectionReason } from "@/types/database.types";
import { RDV_REJECTION_REASON_LABELS } from "@/types/database.types";

export { RDV_REJECTION_REASONS, RDV_REJECTION_REASON_LABELS } from "@/types/database.types";
export type { RdvRejectionReason } from "@/types/database.types";

export function isRdvRejectionReason(value: string): value is RdvRejectionReason {
  return value in RDV_REJECTION_REASON_LABELS;
}

export function getRdvRejectionReasonLabel(
  reason: RdvRejectionReason | string | null | undefined
): string | null {
  if (!reason) return null;
  if (isRdvRejectionReason(reason)) {
    return RDV_REJECTION_REASON_LABELS[reason];
  }
  return reason;
}
