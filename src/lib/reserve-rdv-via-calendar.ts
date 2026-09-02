import { declareExternalRdv, type RdvActionResult } from "@/app/actions/rdv-actions";
import { openRdvBookingUrl } from "@/lib/rdv-booking-url";

export type ExternalRdvDeclarePatch = {
  rdv_status: "PENDING";
  rdv_date: null;
  rdv_rejection_reason: null;
};

/** Ouvre Google Calendar et passe le lead en PENDING pour validation admin. */
export async function reserveRdvViaGoogleCalendar(
  prospectId: string
): Promise<RdvActionResult> {
  const result = await declareExternalRdv(prospectId);
  if (result.ok) {
    openRdvBookingUrl();
  }
  return result;
}

export const EXTERNAL_RDV_DECLARE_PATCH: ExternalRdvDeclarePatch = {
  rdv_status: "PENDING",
  rdv_date: null,
  rdv_rejection_reason: null,
};
