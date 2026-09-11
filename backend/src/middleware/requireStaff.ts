// src/middleware/requireStaff.ts
//
// Runs AFTER requireAuth. It checks the logged-in user's role in the
// profiles table and only lets staff or admin through. RLS is still the
// real guard at the database level; this just gives a clean 403 at the API
// so staff-only routes fail politely instead of returning empty data.

import { Request, Response, NextFunction } from "express";
import { adminClient } from "../lib/supabase";
import { httpError } from "./errorHandler";

export async function requireStaff(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) throw httpError(401, "Not authenticated");

    const { data, error } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", req.userId)
      .single();

    if (error || !data) throw httpError(403, "Not permitted");
    if (data.role !== "staff" && data.role !== "admin") {
      throw httpError(403, "Staff or admin role required");
    }

    next();
  } catch (err) {
    next(err);
  }
}