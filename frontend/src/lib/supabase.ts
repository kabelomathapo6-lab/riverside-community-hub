// src/lib/supabase.ts — the browser Supabase client.
// Uses ONLY the public anon key (safe to expose). The service-role key
// never appears in frontend code. RLS is what keeps data safe here.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url ?? "", anonKey ?? "");
