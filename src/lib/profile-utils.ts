import type { ProfileRow } from "@/types/database.types";

export function getProfileDisplayName(profile: ProfileRow): string {
  const parts = [profile.prenom, profile.nom].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return profile.email;
}
