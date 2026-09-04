import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, UserRound } from "lucide-react";

import { DashboardKpi } from "@/components/dashboard-kpi";
import { ProspectsBoard } from "@/components/prospects-board";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile } from "@/lib/auth";
import { computeDashboardStats, computeProspectorStats } from "@/lib/dashboard-stats";
import { getProfileDisplayName } from "@/lib/profile-utils";
import { createClient } from "@/lib/supabase/server";
import { PROSPECT_LIST_SELECT, type ProfileRow, type ProspectListItem } from "@/types/database.types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminProspecteurPageProps = {
  params: Promise<{ id: string }>;
};

async function getProspecteurProfile(id: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "prospecteur")
    .maybeSingle();

  return data;
}

async function getProspecteurLeads(prospecteurId: string): Promise<ProspectListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prospects")
    .select(PROSPECT_LIST_SELECT)
    .eq("assigned_to", prospecteurId)
    .order("ia_score", { ascending: false, nullsFirst: false });

  return (data ?? []) as unknown as ProspectListItem[];
}

export default async function AdminProspecteurDetailPage({
  params,
}: AdminProspecteurPageProps) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;
  const prospecteur = await getProspecteurProfile(id);

  if (!prospecteur) {
    notFound();
  }

  const prospects = await getProspecteurLeads(id);
  const stats = computeDashboardStats(prospects);
  const displayName = getProfileDisplayName(prospecteur);
  const prospectorStats = computeProspectorStats(prospects, displayName);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/equipe"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <ArrowLeft className="size-4" />
          Retour équipe
        </Link>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl border border-amber-500/15">
        <div className="flex flex-col gap-6 border-b border-border/40 bg-gradient-to-r from-amber-500/[0.06] to-transparent p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="flex items-center gap-5">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl font-bold text-violet-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700/80">
                Fiche prospecteur
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight">{displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {prospecteur.email}
                </span>
                <Badge variant="outline" className="capitalize">
                  {prospecteur.role}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-white/60 px-4 py-3">
            <UserRound className="size-5 text-violet-600" />
            <div>
              <p className="text-xs text-muted-foreground">Inscrit le</p>
              <p className="text-sm font-medium">
                {new Date(prospecteur.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 lg:p-8">
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Taux d&apos;approbation</p>
            <p className="font-mono text-2xl font-bold">{prospectorStats.tauxApprobation}%</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Leads chauds (≥75)</p>
            <p className="font-mono text-2xl font-bold">{prospectorStats.leadsChauds}</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Avec lien client</p>
            <p className="font-mono text-2xl font-bold">{prospectorStats.avecLienClient}</p>
          </div>
        </div>
      </section>

      <DashboardKpi stats={stats} />

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pipeline assigné</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} prospect{stats.total > 1 ? "s" : ""} sous la responsabilité de{" "}
            {displayName}
          </p>
        </div>
        {stats.total > 0 ? (
          <ProspectsBoard
            prospects={prospects}
            detailFrom={`/admin/prospecteurs/${id}`}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun lead assigné à ce prospecteur pour le moment.
          </div>
        )}
      </section>
    </div>
  );
}
