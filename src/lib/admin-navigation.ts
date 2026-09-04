export function buildProspectHref(
  prospectId: string,
  from?: string
): string {
  if (!from || !from.startsWith("/admin")) {
    return `/prospects/${prospectId}`;
  }

  return `/prospects/${prospectId}?from=${encodeURIComponent(from)}`;
}

export function resolveAdminBackHref(from: string | undefined): string {
  if (from && from.startsWith("/admin")) {
    return from;
  }

  return "/admin/leads";
}
