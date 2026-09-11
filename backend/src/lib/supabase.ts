// src/lib/supabase.ts
//
// We create Supabase clients here. There are TWO, and the difference
// matters for security (a brief checkpoint: "no service-role key exposed
// client-side").
//
//  - adminClient uses the SERVICE ROLE key. It bypasses Row Level
//    Security, so it is powerful and DANGEROUS. It lives ONLY on the
//    backend, never sent to the browser. We use it sparingly for trusted
//    server operations.
//
//  - For most requests we instead act on behalf of the logged-in user by
//    forwarding their access token, so RLS still applies. See
//    userClientFromToken below.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  // Fail fast with a clear message rather than crashing mysteriously later.
  console.warn(
    "[supabase] Missing env vars. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in backend/.env",
  );
}

// Server-only admin client. Never expose this to the frontend.
export const adminClient = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

// Build a client that acts AS the logged-in user, so RLS policies apply.
// We pass the user's JWT (from the Authorization header) as the token.
export function userClientFromToken(accessToken: string) {
  return createClient(SUPABASE_URL ?? "", ANON_KEY ?? "", {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
