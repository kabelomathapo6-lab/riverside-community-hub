// src/components/RequireAuth.tsx
//
// Wraps any page that requires a logged-in user. While the auth state is
// still loading we show nothing (avoids a flicker). If there is no session
// once loading finishes, we redirect to /login. An optional staffOnly flag
// also blocks non-staff/admin users, sending them to their dashboard.

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function RequireAuth({
  children,
  staffOnly = false,
}: {
  children: ReactNode;
  staffOnly?: boolean;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-ink-soft">Loading...</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (staffOnly && profile?.role !== "staff" && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}