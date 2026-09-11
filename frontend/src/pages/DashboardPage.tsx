// src/pages/DashboardPage.tsx
//
// The member's home screen. It uses the profile loaded by the auth context
// to greet them and show their membership status. The "expiring soon" flag
// is computed here from membership_expires_at: if the expiry is within the
// next 30 days, we warn them. This is the brief's membership status feature.

import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

function formatDate(iso: string | null): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Returns true when the expiry date is within the next 30 days.
function isExpiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  const expiry = new Date(iso).getTime();
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return expiry > now && expiry - now <= thirtyDays;
}

export default function DashboardPage() {
  const { profile, signOut } = useAuth();

  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-ink-soft">
        Loading your profile...
      </div>
    );
  }

  const expiringSoon = isExpiringSoon(profile.membership_expires_at);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hi, {profile.full_name}</h1>
        <button
          onClick={() => signOut()}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Log out
        </button>
      </div>

      {/* Membership status card */}
      <div className="mt-8 rounded-lg border border-line p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Membership status
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          <div>
            <div className="text-xs text-ink-faint">Tier</div>
            <div className="text-lg font-medium">{profile.membership_tier}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">Joined</div>
            <div className="text-lg font-medium">{formatDate(profile.joined_at)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">Expires</div>
            <div className="text-lg font-medium">
              {formatDate(profile.membership_expires_at)}
            </div>
          </div>
        </div>
        {expiringSoon && (
          <p className="mt-4 inline-block rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
            Your membership is expiring soon. Please contact staff to renew.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        Quick actions
      </h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          to="/facilities"
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Book a resource
        </Link>
        <Link
          to="/my-bookings"
          className="rounded-md border border-line px-4 py-2 font-medium hover:bg-gray-50"
        >
          My bookings
        </Link>
        <Link
          to="/donate"
          className="rounded-md border border-line px-4 py-2 font-medium hover:bg-gray-50"
        >
          Donate
        </Link>
      </div>
    </div>
  );
}