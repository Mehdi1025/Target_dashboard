/** Lien public de prise de RDV — agenda Google d'Adam (Target Agency). */
export const RDV_BOOKING_URL =
  process.env.NEXT_PUBLIC_GOOGLE_RDV_BOOKING_URL ??
  "https://calendar.app.google/jq8dJH2LtunSEPsz7";

/** Personne liée à l'agenda Google (affiché aux prospecteurs). */
export const RDV_CALENDAR_OWNER_NAME =
  process.env.NEXT_PUBLIC_RDV_CALENDAR_OWNER_NAME ?? "Adam";

export const RDV_CALENDAR_OWNER_LABEL =
  process.env.NEXT_PUBLIC_RDV_CALENDAR_OWNER_LABEL ?? "Target Agency";

export function openRdvBookingUrl() {
  window.open(RDV_BOOKING_URL, "_blank", "noopener,noreferrer");
}
