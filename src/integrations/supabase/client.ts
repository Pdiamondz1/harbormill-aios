import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Per-client deploy model: the Supabase project is sourced ENTIRELY from env.
// There are intentionally NO fallback credentials — each client points this at
// their own backend via .env (see .env.example / docs/client-setup.md). A missing
// value fails loudly at startup rather than silently talking to someone else's DB.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[Harbormill AIOS] Missing Supabase config. Set VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY in your .env (copy from .env.example)."
  );
}

export { SUPABASE_URL };

// types.ts ships as a permissive stub until the client runs
// `supabase gen types` against their own project; loosened so call sites compile.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY) as unknown as SupabaseClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types.ts lags the schema; loosened intentionally
  any,
  "public",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  any
>;
