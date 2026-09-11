// src/pages/BookResourcePage.tsx
//
// Book a specific resource. The resource id comes from the URL. We load the
// resource details, let the member pick a date and a start/end time, and
// show the bookings already on that day (from the availability endpoint) so
// they can avoid clashes. On submit we POST /bookings; if the slot overlaps
// an existing booking the backend returns 409 and we show a clear message.

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Resource } from "../types/shared";

interface BookedWindow {
  start_time: string;
  end_time: string;
  status: string;
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookResourcePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  const [booked, setBooked] = useState<BookedWindow[]>([]);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load the resource details once.
  useEffect(() => {
    api
      .get(`/resources/${id}`)
      .then(setResource)
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  // Whenever the date changes, load that day's existing bookings.
  useEffect(() => {
    if (!date) {
      setBooked([]);
      return;
    }
    api
      .get(`/resources/${id}/availability?date=${date}`)
      .then((res) => setBooked(res.booked ?? []))
      .catch(() => setBooked([]));
  }, [id, date]);

  async function submit() {
    setSubmitErr(null);
    setSuccess(null);

    if (!date) {
      setSubmitErr("Please choose a date.");
      return;
    }
    // Combine the chosen date with the times into ISO strings.
    const startIso = new Date(`${date}T${start}:00`).toISOString();
    const endIso = new Date(`${date}T${end}:00`).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setSubmitErr("End time must be after start time.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/bookings", {
        resource_id: id,
        start_time: startIso,
        end_time: endIso,
      });
      setSuccess("Booking requested. It is now pending staff approval.");
      // Refresh the day's bookings so the new one shows.
      const res = await api.get(`/resources/${id}/availability?date=${date}`);
      setBooked(res.booked ?? []);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Could not book");
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load this resource: {loadErr}
        </div>
      </div>
    );
  }

  if (!resource) {
    return <div className="mx-auto max-w-2xl px-5 py-12 text-ink-soft">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <button
        onClick={() => navigate("/facilities")}
        className="text-sm text-brand-600 hover:underline"
      >
        &larr; Back to facilities
      </button>

      <h1 className="mt-4 text-3xl font-bold">Book: {resource.name}</h1>
      <p className="mt-1 text-ink-soft capitalize">
        {resource.type}
        {resource.capacity != null && ` · capacity ${resource.capacity}`}
      </p>

      <div className="mt-8 space-y-4 rounded-lg border border-line p-6">
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">From</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">To</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
            />
          </div>
        </div>

        {/* Existing bookings for the chosen day */}
        {date && (
          <div>
            <div className="text-sm font-medium">Already booked on this day:</div>
            {booked.length === 0 ? (
              <p className="mt-1 text-sm text-ink-faint">Nothing booked yet.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                {booked.map((b, i) => (
                  <li key={i}>
                    {timeOnly(b.start_time)} – {timeOnly(b.end_time)}{" "}
                    <span className="text-ink-faint">({b.status})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {submitErr && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitErr}</p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Requesting..." : "Request booking"}
        </button>
        <p className="text-center text-xs text-ink-faint">
          Your request goes to staff for approval. Overlapping times are blocked.
        </p>
      </div>
    </div>
  );
}