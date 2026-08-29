import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function requireApiAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null,
      response: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  return { supabase, response: null };
}
