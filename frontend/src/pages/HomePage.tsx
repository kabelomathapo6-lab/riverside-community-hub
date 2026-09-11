// src/pages/HomePage.tsx
//
// Public landing page (brief 5.5). Describes Riverside's programmes, shows
// live donation-drive progress from the campaigns endpoint, and gives clear
// calls to action (become a member / donate / browse facilities).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Campaign } from "../types/shared";

const programmes = [
  { title: "Youth programmes", body: "After-school activities and holiday clubs for young people." },
  { title: "Community gym", body: "An affordable, welcoming space to stay active." },
  { title: "Event & meeting rooms", body: "Bookable spaces for groups, classes, and events." },
  { title: "Food-parcel drive", body: "Support neighbours in need through our donation campaigns." },
];

function rands(n: number): string {
  return "R" + Number(n).toLocaleString();
}

export default function HomePage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    api
      .get("/campaigns?active=true")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCampaign(data[0]);
      })
      .catch(() => setCampaign(null));
  }, []);

  const pct =
    campaign && campaign.goal_amount
      ? Math.min(100, Math.round((campaign.current_amount / campaign.goal_amount) * 100))
      : 0;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to Riverside Community Hub
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
            Youth programmes, a community gym, event rooms, and a food-parcel
            donation drive all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
            >
              Become a member
            </Link>
            <Link
              to="/donate"
              className="rounded-md border border-line bg-white px-5 py-2.5 font-medium hover:bg-gray-50"
            >
              Donate now
            </Link>
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold">Our programmes</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programmes.map((p) => (
            <div key={p.title} className="rounded-lg border border-line p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/facilities" className="text-brand-600 hover:underline">
            Browse facilities and availability →
          </Link>
        </div>
      </section>

      {/* Donation drive progress */}
      {campaign && (
        <section className="bg-gray-50">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="text-2xl font-bold">Donation drive</h2>
            <div className="mt-4 rounded-lg border border-line bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{campaign.title}</h3>
                <span className="text-sm text-ink-soft">
                  {rands(campaign.current_amount)} of {rands(campaign.goal_amount)}
                </span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-4">
                <Link
                  to="/donate"
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Support this drive
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}