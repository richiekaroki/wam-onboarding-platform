// frontend/src/app/forms/page.tsx
"use client";

import { getForms, getCurrentUser, loadCurrentUser, logout, isAuthenticated } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  fields: { id: string }[];
}

export default function FormsList() {
  const [forms, setForms]     = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    loadCurrentUser().then((user) => {
      if (user) setUserName(user.first_name || user.email);
      setAuthed(isAuthenticated());
    });

    getForms()
      .then((data) => {
        const allForms = data as unknown as Form[];
        setForms(allForms.filter((f) => f.is_active));
      })
      .catch(() => setNetworkError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--color-surface)" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-(--color-surface) focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-900)" }}>
        Skip to main content
      </a>

      <main id="main-content" style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div className="page-header flex items-end justify-between">
          <div>
            <h1 className="page-title">Available Forms</h1>
            <p className="page-subtitle">
              {userName
                ? `Welcome back, ${userName}`
                : "Select a form below to begin your submission"}
            </p>
          </div>
          {authed ? (
            <button
              onClick={logout}
              className="text-xs font-mono tracking-widest uppercase transition-colors"
              style={{ color: "var(--color-ink-400)", background:"none", border:"none", cursor:"pointer" }}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs font-mono tracking-widest uppercase transition-colors"
              style={{ color: "var(--color-ink-400)", textDecoration:"none" }}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div role="status" aria-busy="true" aria-label="Loading forms" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{
                  height: "6rem",
                  background: "var(--color-ink-100)",
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && networkError && (
          <div className="card text-center py-16" role="alert">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
              Unable to connect to server
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)" }}>
              Check your connection and try again.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary text-xs" style={{ backgroundColor: "var(--color-ink-900)", color: "var(--color-ink-inverse)" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !networkError && forms.length === 0 && getCurrentUser() && (
          <div className="card text-center py-16">
            <div style={{ marginBottom: "1rem", color: "var(--color-ink-300)" }} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
              No forms assigned yet
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)", maxWidth: "320px", margin: "0 auto" }}>
              Your administrator will assign onboarding forms to your account. Once assigned, you'll see them here and can begin your submission.
            </p>
            <p className="text-xs" style={{ color: "var(--color-ink-300)" }}>
              Typically includes KYC, loan applications, or investment declarations.
            </p>
          </div>
        )}

        {!loading && !networkError && forms.length === 0 && !getCurrentUser() && (
          <div className="card text-center py-16">
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-ink-700)" }}>
              Get started with Mr.Wam
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)" }}>
              Create an account to access onboarding forms and track your submissions.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Link href="/login" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "var(--color-ink-900)", color: "var(--color-ink-inverse)" }}>
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Forms list */}
        {!loading && forms.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {forms.map((form, i) => (
              <Link
                key={form.id}
                href={`/forms/${form.slug}`}
                className="card-hover animate-fade-up"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  animationDelay: `${i * 70}ms`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.25rem",
                      color: "var(--color-ink-900)",
                    }}
                  >
                    {form.name}
                  </h3>
                  {form.description && (
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--color-ink-400)" }}
                    >
                      {form.description}
                    </p>
                  )}
                  <p
                    className="mt-3 text-xs font-mono"
                    style={{ color: "var(--color-ink-300)" }}
                  >
                    {form.fields?.length ?? 0} field
                    {(form.fields?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <span style={{ color: "var(--color-ink-300)", marginTop: "0.25rem" }}>
                  →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA for unauthenticated users when forms exist */}
        {!getCurrentUser() && forms.length > 0 && (
          <div
            className="card mt-8"
            style={{ borderColor: "var(--color-info-border)", background: "var(--color-info-bg)" }}
          >
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-ink-700)" }}
            >
              Create an account to track your submissions
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--color-info)" }}>
              Register to save progress and view your submission history.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link href="/login" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "var(--color-ink-900)", color: "var(--color-ink-inverse)" }}>
                Sign in
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
