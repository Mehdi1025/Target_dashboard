import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api-auth";
import { PROSPECT_REPORT_SELECT } from "@/types/prospect";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;

    const { data, error } = await auth.supabase!
      .from("prospects")
      .select(PROSPECT_REPORT_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: error.message ?? "Rapport introuvable." },
        { status }
      );
    }

    return NextResponse.json({ html_rapport: data?.html_rapport ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
