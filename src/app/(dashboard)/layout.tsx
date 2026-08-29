import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
