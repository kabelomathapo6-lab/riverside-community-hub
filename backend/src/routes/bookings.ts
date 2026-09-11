// src/routes/bookings.ts
//
// Booking routes: the heart of the app.
//
//  POST   /bookings              member creates a request (status pending)
//  GET    /bookings/me           member's own bookings
//  PATCH  /bookings/:id/cancel   member cancels their own booking
//  GET    /bookings              staff/admin: all bookings
//  PATCH  /bookings/:id/status   staff/admin: approve or reject (+ notify)
//
// Double-booking is blocked by a database exclusion constraint (see the
// Phase 2 SQL). When it fires, Postgres returns error code 23P01
// (exclusion_violation). We catch that and turn it into a clean 409 so the
// user gets a friendly "slot already taken" instead of a 500.

import { Router } from "express";
import { adminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/requireStaff";
import { httpError } from "../middleware/errorHandler";

const router = Router();

// Helper: clamp pagination the same way the resources route does.
function getPaging(req: any) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20),
  );
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

// POST /bookings  (member) -> create a pending booking for themselves
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { resource_id, start_time, end_time } = req.body ?? {};
    if (!resource_id || !start_time || !end_time) {
      throw httpError(400, "resource_id, start_time and end_time are required");
    }
    if (new Date(end_time) <= new Date(start_time)) {
      throw httpError(400, "end_time must be after start_time");
    }

    const { data, error } = await req.supabase!
      .from("bookings")
      .insert({
        resource_id,
        member_id: req.userId,
        start_time,
        end_time,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23P01") {
        throw httpError(409, "That time slot is already booked for this resource");
      }
      throw httpError(400, error.message);
    }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /bookings/me  (member) -> the caller's own bookings
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = getPaging(req);

    let query = req.supabase!
      .from("bookings")
      .select("*", { count: "exact" })
      .eq("member_id", req.userId)
      .order("start_time", { ascending: false })
      .range(from, to);

    const status = req.query.status ? String(req.query.status) : null;
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw httpError(500, error.message);

    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /bookings/:id/cancel  (member) -> cancel own booking
router.patch("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase!
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", req.params.id)
      .eq("member_id", req.userId)
      .select()
      .single();

    if (error || !data) throw httpError(404, "Booking not found or not yours");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /bookings  (staff/admin) -> all bookings
router.get("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = getPaging(req);

    let query = adminClient
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    const status = req.query.status ? String(req.query.status) : null;
    if (status) query = query.eq("status", status);
    const resourceId = req.query.resource_id ? String(req.query.resource_id) : null;
    if (resourceId) query = query.eq("resource_id", resourceId);

    const { data, error, count } = await query;
    if (error) throw httpError(500, error.message);

    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /bookings/:id/status  (staff/admin) -> approve or reject + notify
router.patch("/:id/status", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (status !== "approved" && status !== "rejected") {
      throw httpError(400, "status must be 'approved' or 'rejected'");
    }

    const { data, error } = await adminClient
      .from("bookings")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23P01") {
        throw httpError(409, "Approving this would clash with another booking");
      }
      throw httpError(400, error.message);
    }
    if (!data) throw httpError(404, "Booking not found");

    await adminClient.from("notifications").insert({
      user_id: data.member_id,
      message: `Your booking was ${status}.`,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;