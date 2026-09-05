import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const WON_LEAD_SELECT =
  "id, entreprise, prenom, nom, email, deal_amount, notes, slug, created_at, rdv_date" as const;

export type WonLeadExport = {
  id: string;
  entreprise: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  deal_amount: number;
  notes: string | null;
  slug: string | null;
  created_at: string;
  rdv_date: string | null;
};

type WonLeadRow = Omit<WonLeadExport, "deal_amount"> & {
  deal_amount: number | string | null;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.AGENCY_API_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("Authorization");
  return authorization === `Bearer ${secret}`;
}

function sortByRecentDate(rows: WonLeadRow[]): WonLeadExport[] {
  return rows
    .map((row) => ({
      id: row.id,
      entreprise: row.entreprise,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      deal_amount: Number(row.deal_amount),
      notes: row.notes,
      slug: row.slug,
      created_at: row.created_at,
      rdv_date: row.rdv_date,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.rdv_date ?? a.created_at).getTime();
      const dateB = new Date(b.rdv_date ?? b.created_at).getTime();
      return dateB - dateA;
    });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client unavailable." },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("prospects")
      .select(WON_LEAD_SELECT)
      .not("deal_amount", "is", null)
      .gt("deal_amount", 0);

    if (error) {
      console.error("[export/won-leads]", error.message);
      return NextResponse.json(
        { error: "Impossible de récupérer les deals gagnés." },
        { status: 500 }
      );
    }

    const prospects = sortByRecentDate((data ?? []) as WonLeadRow[]);

    return NextResponse.json({ data: prospects });
  } catch (err) {
    console.error("[export/won-leads] unexpected:", err);
    const message =
      err instanceof Error ? err.message : "Erreur serveur inattendue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
