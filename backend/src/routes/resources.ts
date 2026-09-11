// src/routes/resources.ts
//
// Resource routes. These are PUBLIC (no login needed) because the brief
// says public visitors can browse facilities and view availability.
//
// We use the admin client for reads here since resources are public data
// and RLS already allows "select using (true)" on this table. Reads are
// paginated to satisfy the brief's "no unbounded queries" rule.

import { Router } from "express";
import { adminClient } from "../lib/supabase";
import { httpError } from "../middleware/errorHandler";

const router = Router();

// GET /resources?type=room|equipment&page=1&pageSize=20
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20),
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from("resources")
      .select("*", { count: "exact" })
      .order("type", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to);

    const type = req.query.type ? String(req.query.type) : null;
    if (type === "room" || type === "equipment") {
      query = query.eq("type", type);
    }

    const { data, error, count } = await query;
    if (error) throw httpError(500, error.message);

    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// GET /resources/:id -> one resource
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await adminClient
      .from("resources")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw httpError(404, "Resource not found");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /resources/:id/availability?date=YYYY-MM-DD
// Returns the booked time windows for that resource on that day, so the UI
// can show which slots are free. Only pending/approved bookings count as busy.
router.get("/:id/availability", async (req, res, next) => {
  try {
    const dateStr = req.query.date ? String(req.query.date) : null;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw httpError(400, "A date query param (YYYY-MM-DD) is required");
    }

    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await adminClient
      .from("bookings")
      .select("start_time, end_time, status")
      .eq("resource_id", req.params.id)
      .in("status", ["pending", "approved"])
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .order("start_time", { ascending: true });

    if (error) throw httpError(500, error.message);

    res.json({
      resource_id: req.params.id,
      date: dateStr,
      booked: data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;