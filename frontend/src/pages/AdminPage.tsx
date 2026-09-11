// src/pages/AdminPage.tsx
//
// The staff/admin dashboard. Three sections:
//  1. Pending bookings queue - approve or reject (fires a notification).
//  2. Member directory - searchable list of profiles.
//  3. Donation report - totals + list, with CSV export (admin only).
//
// The page is reached through a staffOnly route guard. The donation report
// section only renders for admins, since the brief scopes reports to admin.

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import type { Booking, Profile, Donation } from "../types/shared";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function rands(n: number): string {
  return "R" + Number(n).toLocaleString();
}

export default function AdminPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  // --- Pending bookings ---
  const [pending, setPending] = useState<Booking[]>([]);
  const [resNames, setResNames] = useState<Record<string, string>>({});
  const [bookingsErr, setBookingsErr] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  // --- Members ---
  const [members, setMembers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  // --- Donations ---
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<{ total_raised: number; this_month: number } | null>(null);

  async function loadPending() {
    try {
      const [res, resList] = await Promise.all([
        api.get("/bookings?status=pending"),
        api.get("/resources?pageSize=50"),
      ]);
      setPending(res.data ?? []);
      const map: Record<string, string> = {};
      for (const r of resList.data ?? []) map[r.id] = r.name;
      setResNames(map);
    } catch (err) {
      setBookingsErr(err instanceof Error ? err.message : "Failed to load bookings");
    }
  }

  async function loadMembers() {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await api.get(`/profiles${q}`);
    setMembers(res.data ?? []);
  }

  async function loadDonations() {
    if (!isAdmin) return;
    const res = await api.get("/donations");
    setDonations(res.data ?? []);
    setSummary(res.summary ?? null);
  }

  useEffect(() => {
    loadPending();
    loadMembers();
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setPending((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setBookingsErr(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  async function exportCsv() {
    // CSV is not JSON, so we fetch it directly with the auth token.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
    const res = await fetch(`${base}/donations/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>

      {/* Summary tiles (admin only) */}
      {isAdmin && summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line p-5">
            <div className="text-xs text-ink-faint">Total raised</div>
            <div className="text-2xl font-bold">{rands(summary.total_raised)}</div>
          </div>
          <div className="rounded-lg border border-line p-5">
            <div className="text-xs text-ink-faint">This month</div>
            <div className="text-2xl font-bold">{rands(summary.this_month)}</div>
          </div>
          <div className="rounded-lg border border-line p-5">
            <div className="text-xs text-ink-faint">Pending bookings</div>
            <div className="text-2xl font-bold">{pending.length}</div>
          </div>
        </div>
      )}

      {/* Pending bookings queue */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pending bookings</h2>
        {bookingsErr && (
          <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {bookingsErr}
          </div>
        )}
        {pending.length === 0 ? (
          <p className="mt-3 text-ink-soft">No bookings awaiting approval.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((b) => (
                  <tr key={b.id} className="border-t border-line">
                    <td className="px-4 py-3">{resNames[b.resource_id] ?? "Unknown"}</td>
                    <td className="px-4 py-3">{fmtDate(b.start_time)}</td>
                    <td className="px-4 py-3">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => decide(b.id, "approved")}
                          disabled={acting === b.id}
                          className="text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(b.id, "rejected")}
                          disabled={acting === b.id}
                          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Member directory */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-64 rounded-md border border-line px-3 py-2 text-sm"
          />
          <button
            onClick={loadMembers}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-4 py-3">{m.full_name}</td>
                  <td className="px-4 py-3 capitalize">{m.role}</td>
                  <td className="px-4 py-3">{m.membership_tier}</td>
                  <td className="px-4 py-3">{fmtDate(m.joined_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Donation report (admin only) */}
      {isAdmin && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Donation report</h2>
            <button
              onClick={exportCsv}
              className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Donor</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      {d.donor_id ? "Member" : (d.donor_name || "Anonymous")}
                    </td>
                    <td className="px-4 py-3">{rands(d.amount)}</td>
                    <td className="px-4 py-3">
                      {d.pledge_type === "recurring" ? "Pledge" : "One-off"}
                    </td>
                    <td className="px-4 py-3">{fmtDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}