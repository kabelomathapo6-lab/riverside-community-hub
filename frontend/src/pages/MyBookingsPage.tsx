// src/pages/MyBookingsPage.tsx
//
// A member's own bookings (GET /bookings/me), with a cancel action
// (PATCH /bookings/:id/cancel). Bookings only store resource_id, so we
// also load the resources list once and map ids to names for display.
// Handles loading, empty, and error states.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Booking, Resource } from "../types/shared";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-ink-soft",
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [mine, resList] = await Promise.all([
        api.get("/bookings/me"),
        api.get("/resources?pageSize=50"),
      ]);
      setBookings(mine.data ?? []);
      const map: Record<string, string> = {};
      for (const r of (resList.data ?? []) as Resource[]) map[r.id] = r.name;
      setNames(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    setCancelling(id);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      // Reflect the change locally without a full reload.
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My bookings</h1>
        <Link
          to="/facilities"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Book a resource
        </Link>
      </div>

      {loading && <p className="mt-10 text-ink-soft">Loading your bookings...</p>}

      {error && !loading && (
        <div className="mt-10 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="mt-10 text-ink-soft">
          You have no bookings yet.{" "}
          <Link to="/facilities" className="text-brand-600 hover:underline">
            Browse facilities
          </Link>{" "}
          to make one.
        </p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const canCancel = b.status === "pending" || b.status === "approved";
                return (
                  <tr key={b.id} className="border-t border-line">
                    <td className="px-4 py-3">{names[b.resource_id] ?? "Unknown"}</td>
                    <td className="px-4 py-3">{fmtDate(b.start_time)}</td>
                    <td className="px-4 py-3">
                      {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize " +
                          (statusStyles[b.status] ?? "bg-gray-100 text-ink-soft")
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canCancel ? (
                        <button
                          onClick={() => cancel(b.id)}
                          disabled={cancelling === b.id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancelling === b.id ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        <span className="text-ink-faint">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}