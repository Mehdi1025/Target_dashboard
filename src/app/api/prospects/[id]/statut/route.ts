import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { statut?: string };

    if (!body.statut || typeof body.statut !== "string") {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const { data, error } = await auth.supabase!
      .from("prospects")
      .update({ statut: body.statut.trim() })
      .eq("id", id)
      .select("statut")
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: error.message ?? "Impossible de mettre à jour le statut." },
        { status }
      );
    }

    return NextResponse.json({ statut: data?.statut });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
