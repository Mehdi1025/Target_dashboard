import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BriefingRoom } from "@/components/briefing-room";
import { getCurrentProfile } from "@/lib/auth";
import { getBriefingProspects } from "@/lib/get-briefing-prospects";

export const dynamic = "force-dynamic";

function BriefingFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-[640px] animate-pulse rounded-[1.75rem] bg-muted" />
    </div>
  );
}

export default async function BriefingPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?redirect=/prospecteur/briefing");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const { prospects, error } = await getBriefingProspects(profile.id);

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
          Target OS · Briefing
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Préparez votre RDV en{" "}
            <span className="text-gradient-brand">3 minutes.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Forces, faiblesses, angle IA et checklist — un lead à la fois, mode focus.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-sm text-destructive">
          <p className="font-semibold">Erreur de connexion Supabase</p>
          <p className="mt-1 text-destructive/80">{error}</p>
        </div>
      ) : (
        <Suspense fallback={<BriefingFallback />}>
          <BriefingRoom prospects={prospects} />
        </Suspense>
      )}
    </div>
  );
}
