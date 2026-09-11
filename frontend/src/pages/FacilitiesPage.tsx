// src/pages/FacilitiesPage.tsx
//
// Public catalogue of bookable resources. Fetches GET /resources and shows
// each as a card, with a room/equipment filter. Handles the three states
// the brief requires: loading, empty, and error. If a logged-in member
// clicks "Book", we send them to the booking page; if not logged in, we
// send them to log in first.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { Resource } from "../types/shared";

type Filter = "all" | "room" | "equipment";

export default function FacilitiesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const path = filter === "all" ? "/resources" : `/resources?type=${filter}`;
    api
      .get(path)
      .then((res) => {
        if (!cancelled) setResources(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  function handleBook(resourceId: string) {
    if (session) navigate(`/book/${resourceId}`);
    else navigate("/login");
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "room", label: "Rooms" },
    { key: "equipment", label: "Equipment" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-bold">Facilities &amp; Equipment</h1>
      <p className="mt-2 text-ink-soft">
        Browse what Riverside offers. Log in to book a resource.
      </p>

      {/* Filter buttons */}
      <div className="mt-6 flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium " +
              (filter === f.key
                ? "bg-brand-600 text-white"
                : "border border-line hover:bg-gray-50")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* States: loading / error / empty / data */}
      {loading && (
        <p className="mt-10 text-ink-soft">Loading resources...</p>
      )}

      {error && !loading && (
        <div className="mt-10 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load resources: {error}
        </div>
      )}

      {!loading && !error && resources.length === 0 && (
        <p className="mt-10 text-ink-soft">No resources found for this filter.</p>
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex flex-col rounded-lg border border-line p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-ink-soft">
                  {r.type}
                </span>
              </div>
              {r.capacity != null && (
                <p className="mt-1 text-sm text-ink-faint">
                  {r.type === "room" ? "Capacity" : "Units"}: {r.capacity}
                </p>
              )}
              <p className="mt-2 flex-1 text-sm text-ink-soft">{r.description}</p>
              <button
                onClick={() => handleBook(r.id)}
                className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {session ? "View / Book" : "Log in to book"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}