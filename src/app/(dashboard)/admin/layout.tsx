import { redirect } from "next/navigation";

import { AdminDataProvider } from "@/contexts/admin-data-context";
import { getCurrentProfile } from "@/lib/auth";
import { getOrphanProspects } from "@/lib/get-orphan-prospects";
import { getProspecteurs } from "@/lib/get-prospecteurs";
import { getProspects } from "@/lib/get-prospects";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [{ prospects }, { prospecteurs }, { orphans }] = await Promise.all([
    getProspects(),
    getProspecteurs(),
    getOrphanProspects(),
  ]);

  return (
    <AdminDataProvider
      prospects={prospects}
      prospecteurs={prospecteurs}
      orphans={orphans}
    >
      {children}
    </AdminDataProvider>
  );
}
