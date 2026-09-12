// src/App.tsx — routing and shell for the Riverside Community Hub.
// The header nav reflects auth state: public links always show; member
// links appear when logged in; the Admin link appears for staff/admin.
import AdminPage from "./pages/AdminPage";
import DonatePage from "./pages/DonatePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import BookResourcePage from "./pages/BookResourcePage";
import FacilitiesPage from "./pages/FacilitiesPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import RequireAuth from "./components/RequireAuth";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./lib/AuthContext";

function Nav() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isStaff = profile?.role === "staff" || profile?.role === "admin";

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
      <Link to="/facilities" className="hover:text-ink">Facilities</Link>
      <Link to="/donate" className="hover:text-ink">Donate</Link>
      {session ? (
        <>
          <Link to="/dashboard" className="hover:text-ink">Dashboard</Link>
          <Link to="/my-bookings" className="hover:text-ink">My bookings</Link>
          {isStaff && (
            <Link to="/admin" className="hover:text-ink">Admin</Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md border border-line px-3 py-1.5 hover:bg-gray-50"
          >
            Log out
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
        >
          Log in
        </Link>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
          <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-lg font-bold text-brand-600">
            Riverside Community Hub
          </Link>
          <Nav />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-faint">
        Riverside Community Hub.
      </footer>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-ink-soft">This page is scaffolded and will be built in an upcoming phase.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/my-bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
          <Route path="/book/:id" element={<RequireAuth><BookResourcePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth staffOnly><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}