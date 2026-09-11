// src/routes/profiles.ts
//
// Profile routes. The first real, RLS-protected endpoint in the app.
//
// GET /profiles/me returns the logged-in user's own profile row. It uses
// req.supabase (the per-request client scoped to this user), so Row Level
// Security guarantees they can only ever read their own row, even if this
// code had a bug.

import { adminClient } from "../lib/supabase";
import { requireStaff } from "../middleware/requireStaff";
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

// GET /profiles  (staff/admin) -> member directory with search/filter
router.get("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from("profiles")
      .select("*", { count: "exact" })
      .order("joined_at", { ascending: false })
      .range(from, to);

    const search = req.query.search ? String(req.query.search) : null;
    if (search) query = query.ilike("full_name", `%${search}%`);
    const tier = req.query.tier ? String(req.query.tier) : null;
    if (tier) query = query.eq("membership_tier", tier);

    const { data, error, count } = await query;
    if (error) throw httpError(500, error.message);
    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /profiles/:id  (admin) -> change role/tier or renew membership
router.patch("/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { data: me } = await adminClient
      .from("profiles").select("role").eq("id", req.userId).single();
    if (me?.role !== "admin") throw httpError(403, "Admin role required");

    const patch: any = {};
    for (const k of ["role", "membership_tier", "membership_expires_at", "full_name", "contact_info"]) {
      if (k in (req.body ?? {})) patch[k] = req.body[k];
    }
    const { data, error } = await adminClient
      .from("profiles").update(patch).eq("id", req.params.id).select().single();
    if (error || !data) throw httpError(404, "Profile not found");
    res.json(data);
  } catch (err) {
    next(err);
  }
});
export default router;