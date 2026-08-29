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
    const body = (await request.json()) as { notes?: string | null };

    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") {
      return NextResponse.json({ error: "Format de notes invalide." }, { status: 400 });
    }

    const notes = body.notes?.trim() ? body.notes.trim() : null;

    const { data, error } = await auth.supabase!
      .from("prospects")
      .update({ notes })
      .eq("id", id)
      .select("notes")
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: error.message ?? "Impossible de sauvegarder les notes." },
        { status }
      );
    }

    return NextResponse.json({ notes: data?.notes ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
