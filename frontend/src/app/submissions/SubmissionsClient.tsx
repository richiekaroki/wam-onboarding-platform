// frontend/src/app/submissions/SubmissionsClient.tsx
"use client";

import { getSubmissions, getCurrentUser, loadCurrentUser, logout, isAuthenticated, exportSubmissionPdf } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";

interface Submission {
  id: string;
  form: { name: string; slug: string } | string;
  status: string;
  created_at: string;
  updated_at: string;
  client_identifier: string;
  responses: Record<string, any>;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "#dbeafe", color: "#1e40af", label: "Submitted" },
  reviewed:  { bg: "#fef3c7", color: "#92400e", label: "Under Review" },
  approved:  { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  rejected:  { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
};

function getInitials(first: string, last: string, email: string): string {
  if (first || last) return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase();
  return email?.[0]?.toUpperCase() || "?";
}

function getFormName(form: Submission["form"]): string {
  if (typeof form === "object" && form !== null && "name" in form) return form.name;
  return "Unknown Form";
}

function getFormSlug(form: Submission["form"]): string {
  if (typeof form === "object" && form !== null && "slug" in form) return form.slug;
  return "";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SubmissionsClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userFirst, setUserFirst] = useState("");
  const [userLast, setUserLast] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    loadCurrentUser().then((user) => {
      if (user) {
        setUserName(user.first_name || user.email);
        setUserEmail(user.email);
        setUserFirst(user.first_name || "");
        setUserLast(user.last_name || "");
      }
      setAuthed(isAuthenticated());
    });

    getSubmissions()
      .then((data) => setSubmissions(data))
      .catch(() => setNetworkError(true))
      .finally(() => setLoading(false));
  }, []);

  const initials = getInitials(userFirst, userLast, userEmail);
  const displayName = (userFirst || userLast)
    ? [userFirst, userLast].filter(Boolean).join(" ")
    : userEmail;

  const handleExportPdf = async (id: string) => {
    setExportingId(id);
    try {
      await exportSubmissionPdf(id);
    } catch {
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-(--color-surface) focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-900)" }}>
        Skip to main content
      </a>

      {/* Nav bar */}
      <nav style={{ borderBottom: "1px solid var(--color-ink-100)", background: "var(--color-surface-raised)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "3.5rem" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Mr.Wam
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {authed && (
              <>
                <Link href="/forms" style={{ fontSize: "0.72rem", color: "var(--color-ink-900)", letterSpacing: "0.1em", textTransform: "uppercase" as const, textDecoration: "none", fontWeight: 500 }}>
                  Forms
                </Link>
                <Link href="/submissions" style={{ fontSize: "0.72rem", color: "var(--color-gold)", letterSpacing: "0.1em", textTransform: "uppercase" as const, textDecoration: "none", fontWeight: 600, borderBottom: "2px solid var(--color-gold)", paddingBottom: "2px" }}>
                  My Submissions
                </Link>
                <ThemeToggle />
                <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "var(--color-ink-900)", color: "var(--color-gold)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-display)",
                  }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-ink-600)" }}>
                    {displayName}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  style={{ fontSize: "0.72rem", color: "var(--color-ink-400)", letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Sign out
                </button>
              </>
            )}
          </div>

          {/* Mobile nav */}
          {authed && (
            <MobileNav
              items={[
                { href: "/forms", label: "Forms" },
                { href: "/submissions", label: "My Submissions", active: true },
                { href: "/profile", label: "Profile" },
              ]}
              onLogout={logout}
              userInitials={initials}
              userName={displayName}
            />
          )}
        </div>
      </nav>

      <main id="main-content" style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1rem" }}>
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">
            {userName
              ? `Showing submissions for ${userName}`
              : "Track the status of your submissions"}
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div role="status" aria-busy="true" aria-label="Loading submissions" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{
                  height: "5rem",
                  background: "var(--color-ink-100)",
                }}
              />
            ))}
          </div>
        )}

        {/* Network error */}
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

        {/* Empty state */}
        {!loading && !networkError && submissions.length === 0 && (
          <div className="card text-center py-16">
            <div style={{ marginBottom: "1rem", color: "var(--color-ink-300)" }} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
              No submissions yet
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)", maxWidth: "320px", margin: "0 auto" }}>
              Once you submit a form, it will appear here with its current status.
            </p>
            <Link href="/forms" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "var(--color-ink-900)", color: "var(--color-ink-inverse)" }}>
              View Forms
            </Link>
          </div>
        )}

        {/* Submissions list */}
        {!loading && submissions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {submissions.map((sub, i) => {
              const style = STATUS_STYLES[sub.status] || STATUS_STYLES.submitted;
              return (
                <div
                  key={sub.id}
                  className="card animate-fade-up"
                  style={{
                    animationDelay: `${i * 70}ms`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.1rem",
                        color: "var(--color-ink-900)",
                        marginBottom: "0.25rem",
                      }}>
                        {getFormName(sub.form)}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--color-ink-400)" }}>
                        Submitted {formatDateTime(sub.created_at)}
                      </p>
                      {sub.client_identifier && (
                        <p className="text-xs mt-1" style={{ color: "var(--color-ink-300)" }}>
                          Client: {sub.client_identifier}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <button
                        onClick={() => handleExportPdf(sub.id)}
                        disabled={exportingId === sub.id}
                        style={{
                          fontSize: "0.7rem",
                          color: exportingId === sub.id ? "var(--color-ink-300)" : "var(--color-ink-600)",
                          background: "none",
                          border: "1px solid var(--color-ink-200)",
                          borderRadius: "4px",
                          padding: "0.25rem 0.5rem",
                          cursor: exportingId === sub.id ? "wait" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {exportingId === sub.id ? "Exporting..." : "PDF"}
                      </button>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase" as const,
                        background: style.bg,
                        color: style.color,
                        whiteSpace: "nowrap",
                      }}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
