// src/routes/campaigns.ts
//
//  GET   /campaigns          public: campaigns for progress bars
//  POST  /campaigns          admin: create
//  PATCH /campaigns/:id      admin: edit / toggle active

import { Router } from "express";
import { adminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { httpError } from "../middleware/errorHandler";

const router = Router();

async function requireAdmin(req: any) {
  const { data } = await adminClient
    .from("profiles").select("role").eq("id", req.userId).single();
  if (data?.role !== "admin") throw httpError(403, "Admin role required");
}

// GET /campaigns?active=true  (public)
router.get("/", async (req, res, next) => {
  try {
    let query = adminClient.from("campaigns").select("*").order("created_at", { ascending: false });
    if (req.query.active === "true") query = query.eq("active", true);
    if (req.query.active === "false") query = query.eq("active", false);
    const { data, error } = await query;
    if (error) throw httpError(500, error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /campaigns  (admin)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { title, goal_amount, active } = req.body ?? {};
    if (!title || goal_amount == null) {
      throw httpError(400, "title and goal_amount are required");
    }
    const { data, error } = await adminClient
      .from("campaigns")
      .insert({ title, goal_amount: Number(goal_amount), active: active ?? true })
      .select()
      .single();
    if (error) throw httpError(400, error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /campaigns/:id  (admin)
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    await requireAdmin(req);
    const patch: any = {};
    for (const k of ["title", "goal_amount", "active"]) {
      if (k in (req.body ?? {})) patch[k] = req.body[k];
    }
    const { data, error } = await adminClient
      .from("campaigns").update(patch).eq("id", req.params.id).select().single();
    if (error || !data) throw httpError(404, "Campaign not found");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;