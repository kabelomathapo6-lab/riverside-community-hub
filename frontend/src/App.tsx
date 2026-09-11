// src/App.tsx — routing skeleton for the Riverside Community Hub.
// Public pages are open; member/staff/admin areas will be gated by auth
// and role as we build each feature.
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-lg font-bold text-brand-600">Riverside Community Hub</Link>
          <div className="flex gap-5 text-sm text-ink-soft">
            <Link to="/facilities" className="hover:text-ink">Facilities</Link>
            <Link to="/donate" className="hover:text-ink">Donate</Link>
            <Link to="/login" className="hover:text-ink">Log in</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-faint">
        Riverside Community Hub — student project.
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
          <Route path="/" element={<Placeholder title="Welcome to Riverside" />} />
          <Route path="/facilities" element={<Placeholder title="Facilities & Availability" />} />
          <Route path="/donate" element={<Placeholder title="Donation Drive" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Placeholder title="Member Dashboard" />} />
          <Route path="/admin" element={<Placeholder title="Admin Dashboard" />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
