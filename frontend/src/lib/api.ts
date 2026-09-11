// src/lib/api.ts
//
// A small wrapper around fetch for talking to our backend API.
// It automatically attaches the logged-in user's Supabase access token
// as a Bearer header, so individual pages never have to think about auth.
// The base URL comes from VITE_API_URL (http://localhost:4000 in dev).

import { supabase } from "./supabase";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
  if (!res.ok) {
    // Our backend always sends { error: "..." } on failure.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new Error(message);
  }
  // Some endpoints (like CSV) are not JSON; callers that need those can use
  // fetch directly. Everything in our app returns JSON.
  return res.json();
}

export const api = {
  async get(path: string) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { ...(await authHeader()) },
    });
    return handle(res);
  },
  async post(path: string, body?: unknown) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handle(res);
  },
  async patch(path: string, body?: unknown) {
    const res = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handle(res);
  },
};