// src/routes/donations.ts
//
//  POST /donations           public (anonymous allowed) or member
//  GET  /donations/me        member: own giving history
//  GET  /donations           admin: full report + summary
//  GET  /donations/export    admin: CSV download
//
// Donations can be anonymous, so POST does not require auth. If a valid
// token is present we attach donor_id; otherwise it stays null and an
// optional donor_name is used. When a donation names a campaign we bump
// that campaign's current_amount so the public progress bar moves.

import { Router } from "express";
import { adminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/requireStaff";
import { httpError } from "../middleware/errorHandler";

const router = Router();

function getPaging(req: any) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20),
  );
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

// Try to identify the caller from a Bearer token, but do not require it.
async function optionalUserId(req: any): Promise<string | null> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const { data } = await adminClient.auth.getUser(token);
  return data?.user?.id ?? null;
}

// POST /donations  (public or member)
router.post("/", async (req, res, next) => {
  try {
    const { amount, campaign_id, pledge_type, donor_name } = req.body ?? {};
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      throw httpError(400, "A positive amount is required");
    }
    const pledge = pledge_type === "recurring" ? "recurring" : "one_off";

    const donorId = await optionalUserId(req);

    const { data, error } = await adminClient
      .from("donations")
      .insert({
        donor_id: donorId,
        campaign_id: campaign_id ?? null,
        amount: amt,
        pledge_type: pledge,
        donor_name: donorId ? null : (donor_name ?? null),
      })
      .select()
      .single();

    if (error) throw httpError(400, error.message);

    // Move the campaign progress bar, if this donation targets a campaign.
    if (data.campaign_id) {
      const { data: camp } = await adminClient
        .from("campaigns")
        .select("current_amount")
        .eq("id", data.campaign_id)
        .single();
      if (camp) {
        await adminClient
          .from("campaigns")
          .update({ current_amount: Number(camp.current_amount) + amt })
          .eq("id", data.campaign_id);
      }
    }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /donations/me  (member) -> own giving history
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = getPaging(req);
    const { data, error, count } = await req.supabase!
      .from("donations")
      .select("*", { count: "exact" })
      .eq("donor_id", req.userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw httpError(500, error.message);
    res.json({ data, page, pageSize, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// GET /donations  (admin) -> full report with summary
router.get("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    // requireStaff lets staff and admin through; the brief scopes the report
    // to admin, so we tighten it here.
    const { data: me } = await adminClient
      .from("profiles").select("role").eq("id", req.userId).single();
    if (me?.role !== "admin") throw httpError(403, "Admin role required");

    const { page, pageSize, from, to } = getPaging(req);
    const { data, error, count } = await adminClient
      .from("donations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw httpError(500, error.message);

    // Summary: total raised all-time and this calendar month.
    const { data: all } = await adminClient.from("donations").select("amount, created_at");
    const totalRaised = (all ?? []).reduce((s, d: any) => s + Number(d.amount), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = (all ?? [])
      .filter((d: any) => new Date(d.created_at) >= monthStart)
      .reduce((s, d: any) => s + Number(d.amount), 0);

    res.json({
      data, page, pageSize, total: count ?? 0,
      summary: { total_raised: totalRaised, this_month: thisMonth },
    });
  } catch (err) {
    next(err);
  }
});

// GET /donations/export  (admin) -> CSV
router.get("/export", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { data: me } = await adminClient
      .from("profiles").select("role").eq("id", req.userId).single();
    if (me?.role !== "admin") throw httpError(403, "Admin role required");

    const { data, error } = await adminClient
      .from("donations")
      .select("id, donor_id, donor_name, campaign_id, amount, pledge_type, created_at")
      .order("created_at", { ascending: false });
    if (error) throw httpError(500, error.message);

    const header = "id,donor_id,donor_name,campaign_id,amount,pledge_type,created_at";
    const rows = (data ?? []).map((d: any) =>
      [d.id, d.donor_id ?? "", (d.donor_name ?? "").replace(/,/g, " "),
       d.campaign_id ?? "", d.amount, d.pledge_type, d.created_at].join(","),
    );
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="donations.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;