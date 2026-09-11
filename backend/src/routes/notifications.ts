// src/routes/notifications.ts
//
//  GET   /notifications/me         member: own notifications
//  PATCH /notifications/:id/read   member: mark own as read
//
// Both use req.supabase (the user-scoped client), so RLS guarantees a user
// only ever touches their own notifications.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { httpError } from "../middleware/errorHandler";

const router = Router();

// GET /notifications/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await req.supabase!
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw httpError(500, error.message);
    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase!
      .from("notifications")
      .update({ read: true })
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select()
      .single();
    if (error || !data) throw httpError(404, "Notification not found or not yours");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;