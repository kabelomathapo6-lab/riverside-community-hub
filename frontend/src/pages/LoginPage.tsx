// src/pages/LoginPage.tsx
//
// Handles both logging in and signing up, toggled by a mode switch.
// On success it sends the user to their dashboard. Sign-up passes the
// full name through to Supabase metadata, which our database trigger uses
// to fill the new profile row.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName);
        // Depending on Supabase settings, sign-up may require email
        // confirmation before the first login works.
        setNotice(
          "Account created. If email confirmation is on, check your inbox, then log in.",
        );
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Log in" : "Create your membership"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {mode === "login"
          ? "Welcome back to Riverside Community Hub."
          : "Join Riverside to book facilities and track your membership."}
      </p>

      <div className="mt-8 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Thabo Mokoena"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        <p className="text-center text-sm text-ink-soft">
          {mode === "login" ? "New to Riverside? " : "Already a member? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="font-medium text-brand-600 hover:underline"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}