import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireApiAuth } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";
import type { Database } from "@/types/database.types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function buildUniqueSlug(
  supabase: SupabaseClient<Database>,
  entreprise: string,
  prospectId: string
) {
  const baseSlug = slugify(entreprise) || "prospect";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data } = await supabase
      .from("prospects")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || data.id === prospectId) {
      return candidate;
    }
  }

  return `${baseSlug}-${prospectId.slice(0, 8)}`;
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const supabase = auth.supabase!;

    const { data: prospect, error: fetchError } = await supabase
      .from("prospects")
      .select("id, entreprise, slug")
      .eq("id", id)
      .single();

    if (fetchError || !prospect) {
      return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    }

    if (prospect.slug) {
      return NextResponse.json({ slug: prospect.slug });
    }

    const slug = await buildUniqueSlug(supabase, prospect.entreprise, prospect.id);

    const { data: updated, error: updateError } = await supabase
      .from("prospects")
      .update({ slug })
      .eq("id", id)
      .select("slug")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Impossible de générer le slug." },
        { status: 500 }
      );
    }

    return NextResponse.json({ slug: updated.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
