import { redirect } from "next/navigation";

import { AdminDataProvider } from "@/contexts/admin-data-context";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return <AdminDataProvider>{children}</AdminDataProvider>;
}
