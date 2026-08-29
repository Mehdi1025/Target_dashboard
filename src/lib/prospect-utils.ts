export function getStatutBadgeClass(statut: string) {
  const normalized = statut.toLowerCase();

  if (normalized.includes("valider")) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }

  if (normalized.includes("approuv") || normalized.includes("envoy")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }

  if (normalized.includes("refus") || normalized.includes("rejet")) {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

export function getFullName(
  prenom: string | null | undefined,
  nom: string | null | undefined
) {
  const fullName = [prenom, nom].filter(Boolean).join(" ").trim();
  return fullName || "—";
}

export function getContactLine(
  prenom: string | null | undefined,
  nom: string | null | undefined,
  poste: string | null | undefined,
  email: string
) {
  const parts = [getFullName(prenom, nom)];

  if (poste) {
    parts.push(poste);
  }

  parts.push(email);

  return parts.join(" · ");
}
