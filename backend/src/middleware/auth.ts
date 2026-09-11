// src/middleware/auth.ts
//
// This middleware protects routes that require a logged-in user.
//
// How it works:
//  1. The frontend logs in with Supabase and gets an access token (a JWT).
//  2. It sends that token on every request as: Authorization: Bearer <token>
//  3. This middleware reads the token, asks Supabase to verify it, and if
//     valid attaches the user (and a per-request Supabase client that acts
//     AS that user, so RLS applies) to req.
//  4. If there is no token or it is invalid, we stop with 401.
//
// Because the per-request client uses the user's own token, every query it
// runs is filtered by our Row Level Security policies. That is the whole
// point: the database, not just this code, decides what the user can see.

import { Request, Response, NextFunction } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, userClientFromToken } from "../lib/supabase";
import { httpError } from "./errorHandler";

// We add two things to the Express request object so routes can use them.
// (Declaration merging lets TypeScript know about our extra fields.)
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      supabase?: SupabaseClient;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw httpError(401, "Missing or malformed Authorization header");
    }

    // Ask Supabase who this token belongs to. This verifies the signature
    // and expiry for us. We use the admin client only to validate the token.
    const { data, error } = await adminClient.auth.getUser(token);

    if (error || !data.user) {
      throw httpError(401, "Invalid or expired token");
    }

    // Attach the user id and a client scoped to this user (RLS applies).
    req.userId = data.user.id;
    req.supabase = userClientFromToken(token);

    next();
  } catch (err) {
    next(err);
  }
}