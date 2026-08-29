import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Client anon sans session — pages publiques (/audit/[slug]) */
export function createPublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env.local"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
