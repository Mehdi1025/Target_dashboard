export type ProspectCountry = "CH" | "FR";

export const PROSPECT_COUNTRIES = ["CH", "FR"] as const satisfies readonly ProspectCountry[];

export const PROSPECT_COUNTRY_LABELS: Record<ProspectCountry, string> = {
  CH: "Suisse",
  FR: "France",
};

export const PROSPECT_COUNTRY_FLAGS: Record<ProspectCountry, string> = {
  CH: "🇨🇭",
  FR: "🇫🇷",
};

export function isProspectCountry(value: string): value is ProspectCountry {
  return (PROSPECT_COUNTRIES as readonly string[]).includes(value);
}

export function getProspectCountryLabel(pays: string | null | undefined): string {
  if (!pays) return "Non renseigné";
  if (isProspectCountry(pays)) return PROSPECT_COUNTRY_LABELS[pays];
  return pays;
}

export function getProspectCountryBadge(pays: string | null | undefined): string {
  if (!pays || !isProspectCountry(pays)) return "—";
  return `${PROSPECT_COUNTRY_FLAGS[pays]} ${PROSPECT_COUNTRY_LABELS[pays]}`;
}

export type CountryFilterKey = "all" | ProspectCountry;

export const COUNTRY_FILTERS: { key: CountryFilterKey; label: string }[] = [
  { key: "all", label: "Tous pays" },
  { key: "CH", label: "🇨🇭 Suisse" },
  { key: "FR", label: "🇫🇷 France" },
];

export function matchesCountryFilter(
  pays: string | null | undefined,
  filter: CountryFilterKey
): boolean {
  if (filter === "all") return true;
  return pays === filter;
}

export function countByCountry(
  prospects: readonly { pays: string | null }[],
  country: ProspectCountry
): number {
  return prospects.filter((prospect) => prospect.pays === country).length;
}
