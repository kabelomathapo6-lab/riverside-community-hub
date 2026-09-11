// src/routes/profiles.ts
//
// Profile routes. The first real, RLS-protected endpoint in the app.
//
// GET /profiles/me returns the logged-in user's own profile row. It uses
// req.supabase (the per-request client scoped to this user), so Row Level
// Security guarantees they can only ever read their own row, even if this
// code had a bug.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { httpError } from "../middleware/errorHandler";

const router = Router();

// GET /profiles/me  -> the caller's own profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    // req.supabase acts as the logged-in user, so RLS applies.
    const { data, error } = await req.supabase!
      .from("profiles")
      .select("*")
      .eq("id", req.userId!)
      .single();

    if (error) throw httpError(404, "Profile not found");

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;