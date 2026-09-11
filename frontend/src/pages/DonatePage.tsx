// src/pages/DonatePage.tsx
//
// Public donation drive. Shows active campaigns with a progress bar toward
// their goal, and a form to donate. Donations work without logging in
// (anonymous), matching the brief. If the donor is logged in the backend
// links the gift to them automatically; otherwise they can leave a name.
// After a successful donation we reload campaigns so the bar moves.

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { Campaign } from "../types/shared";

function rands(n: number): string {
  return "R" + Number(n).toLocaleString();
}

export default function DonatePage() {
  const { session } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [campaignId, setCampaignId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [pledgeType, setPledgeType] = useState<"one_off" | "recurring">("one_off");
  const [donorName, setDonorName] = useState("");

  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadCampaigns() {
    setLoading(true);
    setLoadErr(null);
    try {
      const data = await api.get("/campaigns?active=true");
      setCampaigns(data ?? []);
      if ((data ?? []).length > 0 && !campaignId) setCampaignId(data[0].id);
    } catch (err) {
      setLoadErr(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function donate() {
    setSubmitErr(null);
    setSuccess(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setSubmitErr("Please enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/donations", {
        amount: amt,
        campaign_id: campaignId || null,
        pledge_type: pledgeType,
        donor_name: session ? undefined : donorName || undefined,
      });
      setSuccess(`Thank you for your ${rands(amt)} donation!`);
      setAmount("");
      setDonorName("");
      await loadCampaigns(); // refresh the progress bar
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Could not process donation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Support Riverside</h1>
      <p className="mt-2 text-ink-soft">
        Your donation helps fund our programmes. You can give without an account.
      </p>

      {/* Active campaigns with progress bars */}
      {loading && <p className="mt-8 text-ink-soft">Loading campaigns...</p>}
      {loadErr && !loading && (
        <div className="mt-8 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadErr}
        </div>
      )}
      {!loading && !loadErr && campaigns.length > 0 && (
        <div className="mt-8 space-y-4">
          {campaigns.map((c) => {
            const pct = c.goal_amount
              ? Math.min(100, Math.round((c.current_amount / c.goal_amount) * 100))
              : 0;
            return (
              <div key={c.id} className="rounded-lg border border-line p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.title}</h3>
                  <span className="text-sm text-ink-soft">
                    {rands(c.current_amount)} of {rands(c.goal_amount)}
                  </span>
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-faint">{pct}% of goal</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Donation form */}
      <div className="mt-8 space-y-4 rounded-lg border border-line p-6">
        <h2 className="text-lg font-semibold">Make a donation</h2>

        {campaigns.length > 0 && (
          <div>
            <label className="block text-sm font-medium">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Amount (R)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            placeholder="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Type</label>
          <div className="mt-1 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={pledgeType === "one_off"}
                onChange={() => setPledgeType("one_off")}
              />
              One-off
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={pledgeType === "recurring"}
                onChange={() => setPledgeType("recurring")}
              />
              Adopt a food parcel (pledge)
            </label>
          </div>
        </div>

        {!session && (
          <div>
            <label className="block text-sm font-medium">
              Name (optional, for anonymous gifts)
            </label>
            <input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              placeholder="Leave blank to stay anonymous"
            />
          </div>
        )}

        {submitErr && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitErr}</p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        )}

        <button
          onClick={donate}
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Processing..." : "Give now"}
        </button>
        <p className="text-center text-xs text-ink-faint">
          Donations are recorded for the organisation. No card details are stored.
        </p>
      </div>
    </div>
  );
}