import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuditPending } from "@/components/audit-pending";
import { PublicHtmlReport } from "@/components/public-html-report";
import { createSupabaseClient } from "@/lib/supabase";
import { getFullName } from "@/lib/prospect-utils";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  params: Promise<{ slug: string }>;
};

type AuditLookupResult =
  | {
      status: "ready";
      entreprise: string;
      prenom: string;
      html_rapport: string;
      visitorName: string;
      visitorEmail: string | null;
    }
  | { status: "pending"; entreprise: string; slug: string }
  | { status: "missing" };

async function getAuditReportBySlug(slug: string): Promise<AuditLookupResult> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("prospects")
      .select("id, entreprise, prenom, nom, email, slug, html_rapport")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return { status: "missing" };
    }

    if (!data.html_rapport?.trim()) {
      return {
        status: "pending",
        entreprise: data.entreprise,
        slug: data.slug ?? slug,
      };
    }

    const visitorName = getFullName(data.prenom, data.nom);
    const resolvedVisitorName =
      visitorName !== "—" ? visitorName : data.entreprise;

    return {
      status: "ready",
      entreprise: data.entreprise,
      prenom: data.prenom ?? data.entreprise,
      html_rapport: data.html_rapport,
      visitorName: resolvedVisitorName,
      visitorEmail: data.email ?? null,
    };
  } catch {
    return { status: "missing" };
  }
}

export async function generateMetadata({ params }: AuditPageProps): Promise<Metadata> {
  const { slug } = await params;
  const audit = await getAuditReportBySlug(slug);

  if (audit.status === "ready") {
    return {
      title: `Brand Audit — ${audit.entreprise}`,
      description: `Rapport brand executive généré par Target OS pour ${audit.entreprise}.`,
      robots: { index: false, follow: false },
    };
  }

  if (audit.status === "pending") {
    return {
      title: `Rapport en préparation — ${audit.entreprise}`,
      description: "Le rapport brand est en cours de génération.",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: "Rapport introuvable",
    description: "Ce rapport n'existe pas.",
    robots: { index: false, follow: false },
  };
}

export default async function PublicAuditPage({ params }: AuditPageProps) {
  const { slug } = await params;
  const audit = await getAuditReportBySlug(slug);

  if (audit.status === "missing") {
    notFound();
  }

  if (audit.status === "pending") {
    return <AuditPending entreprise={audit.entreprise} slug={audit.slug} />;
  }

  return (
    <main className="min-h-screen w-full bg-black">
      <PublicHtmlReport
        html={audit.html_rapport}
        prenom={audit.prenom}
        entreprise={audit.entreprise}
        visitorName={audit.visitorName}
        visitorEmail={audit.visitorEmail}
      />
    </main>
  );
}
