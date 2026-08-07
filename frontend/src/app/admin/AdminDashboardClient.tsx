// frontend/src/app/admin/page.tsx
"use client";

import {
  getForms,
  getSubmissions,
  getNotifications,
  updateSubmissionStatus,
  loadCurrentUser,
  isAdmin,
  logout,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  submission_count: number;
  fields: { id: string }[];
}

interface Submission {
  id: string;
  form: string;
  status: "submitted" | "reviewed" | "approved" | "rejected";
  created_at: string;
  client_identifier: string | null;
  submitted_by: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [forms,       setForms]       = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState("Check your connection and try again.");
  const [toast,       setToast]       = useState<{ message: string; type: "success" | "error"; onUndo?: () => void } | null>(null);
  const [subPage,     setSubPage]     = useState(0);
  const [totalSubs,   setTotalSubs]   = useState(0);
  const PAGE_SIZE = 20; // Must match backend PAGE_SIZE
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadCurrentUser().then((user) => {
      if (!user || !isAdmin()) {
        router.push(user ? "/forms" : "/login");
        return;
      }
      fetchAll();
    });
  }, []);

  const fetchAll = async () => {
    try {
const [formsRes, subsRes, notifsData] = await Promise.all([
      getForms(1),
      getSubmissions(1),
      getNotifications(),
    ]);
    setForms(formsRes as unknown as Form[]);
    setSubmissions(subsRes as unknown as Submission[]);
    setTotalSubs(subsRes.length);
      setUnread(notifsData.filter((n: { is_read: boolean }) => !n.is_read).length);
    } catch (err: unknown) {
      setFetchError(true);
      const msg = err instanceof Error ? err.message : "Check your connection and try again.";
      setFetchErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionsPage = async (page: number) => {
    try {
      const subsRes = await getSubmissions(page);
      setSubmissions(subsRes as unknown as Submission[]);
      setTotalSubs(subsRes.length);
    } catch {
      // Keep existing data on error
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;

    // Optimistic update
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: newStatus as Submission["status"] } : s
      )
    );

    // Show toast with undo
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setToast({
      message: `Status changed to ${newStatus}`,
      type: "success",
      onUndo: () => {
        // Revert optimistic update
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: currentStatus as Submission["status"] } : s
          )
        );
        setToast(null);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      },
    });
    undoTimeoutRef.current = setTimeout(() => setToast(null), 5000);

    try {
      await updateSubmissionStatus(id, newStatus);
    } catch {
      // Revert on failure
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: currentStatus as Submission["status"] } : s
        )
      );
      setToast({ message: "Failed to update status. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const pending = submissions.filter((s) => s.status === "submitted");

  const statCards = [
    { label: "Total Forms",    value: forms.length,          href: "#forms"              },
    { label: "Submissions",    value: totalSubs,              href: "#submissions"        },
    { label: "Pending Review", value: pending.length,         href: "#needs-attention"    },
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-surface)" }}
        role="status"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <span
          className="animate-spin"
          style={{
            width: "2rem", height: "2rem",
            border: "2px solid var(--color-ink-100)",
            borderTopColor: "var(--color-ink-900)",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center py-16" role="alert">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
            Unable to load dashboard
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)" }}>
            {fetchErrorMsg}
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "#C9A84C", color: "#0D1117", fontWeight: 500, borderRadius: "4px", cursor: "pointer", border: "none", letterSpacing: "0.025em" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed", top: "1rem", right: "1rem", zIndex: 100,
            padding: "0.75rem 1.25rem", borderRadius: "4px",
            fontSize: "0.8rem", fontWeight: 500, fontFamily: "var(--font-body)",
            display: "flex", alignItems: "center", gap: "0.75rem",
            background: toast.type === "success" ? "var(--color-status-approved-bg)" : "var(--color-status-rejected-bg)",
            color: toast.type === "success" ? "var(--color-status-approved-text)" : "var(--color-status-rejected-text)",
            border: `1px solid ${toast.type === "success" ? "var(--color-status-approved-border)" : "var(--color-status-rejected-border)"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            animation: "fadeUp 0.3s ease",
          }}
        >
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.8rem", fontWeight: 600, textDecoration: "underline",
                color: "inherit", padding: 0,
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-(--color-surface) focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-900)" }}>
        Skip to main content
      </a>

      {/* ── Top bar ── */}
      <div
        style={{
          background: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-ink-100)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)", textDecoration: "none" }}>
          Mr.Wam
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/admin/forms/create" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "#C9A84C", color: "#0D1117", fontWeight: 500, borderRadius: "4px", textDecoration: "none", letterSpacing: "0.025em" }}>
            + New Form
          </Link>
          <button onClick={logout} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", backgroundColor: "transparent", fontWeight: 500, borderRadius: "4px", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>

      <main id="main-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                <div style={{ height: "2.5rem", width: "4rem", background: "var(--color-ink-100)", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div style={{ height: "0.75rem", width: "5rem", background: "var(--color-ink-100)", borderRadius: "4px" }} />
              </div>
            ))
          ) : (
            statCards.map((s, i) => (
              <Link
                key={s.label}
                href={s.href}
                className="card-hover animate-fade-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                }}
                role="region"
                aria-labelledby={`stat-${i}`}
              >
                <p
                  id={`stat-${i}`}
                  style={{ fontFamily: "var(--font-body)", fontSize: "2.5rem", fontWeight: 700, color: "var(--color-ink-900)", lineHeight: 1 }}
                >
                  {s.value}
                </p>
                <p className="text-xs font-mono tracking-wide mt-1" style={{ color: "var(--color-ink-400)" }}>
                  {s.label}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* ── First-run welcome ── */}
        {forms.length === 0 && !loading && (
          <div
            className="card"
            style={{
              marginBottom: "3rem",
              padding: "2rem",
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-ink-100)",
            }}
          >
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)", marginBottom: "0.75rem" }}>
              Welcome to Mr.Wam Admin
            </h3>
            <p className="text-sm" style={{ color: "var(--color-ink-600)", marginBottom: "1rem", maxWidth: "600px" }}>
              Get started by creating your first onboarding form. You can build dynamic forms with conditional logic, file uploads, and currency fields — then share them with clients.
            </p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-gold)", fontSize: "1rem" }}>1.</span>
                <span className="text-xs" style={{ color: "var(--color-ink-600)" }}>Create a form with the visual builder</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-gold)", fontSize: "1rem" }}>2.</span>
                <span className="text-xs" style={{ color: "var(--color-ink-600)" }}>Share the form link with clients</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-gold)", fontSize: "1rem" }}>3.</span>
                <span className="text-xs" style={{ color: "var(--color-ink-600)" }}>Review submissions and update status</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Needs attention: Pending submissions ── */}
        {pending.length > 0 && (
          <div id="needs-attention" style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
                Needs attention
              </h2>
              <span
                className="badge badge-submitted"
                style={{ fontSize: "0.7rem" }}
              >
                {pending.length} pending
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pending.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="card"
                  style={{
                    display: "flex", alignItems: "center", gap: "1.5rem",
                    borderLeft: "3px solid var(--color-status-submitted-border)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-mono text-sm" style={{ color: "var(--color-ink-900)" }}>
                      {sub.id.slice(0, 8)}…
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-400)" }}>
                      {sub.client_identifier ?? sub.submitted_by ?? "Anonymous"} ·{" "}
                      {new Date(sub.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Inline status changer */}
                  <select
                    value={sub.status}
                    onChange={(e) => handleStatusChange(sub.id, e.target.value, sub.status)}
                    aria-label={`Change status for submission ${sub.id.slice(0, 8)}`}
                    className="input"
                    style={{
                      width: "auto",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    <option value="submitted">submitted</option>
                    <option value="reviewed">reviewed</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>

                  <span className="badge badge-submitted">● submitted</span>
                </div>
              ))}
            </div>

            {pending.length > 5 && (
              <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
                <a
                  href="#submissions"
                  className="text-xs font-mono tracking-wide"
                  style={{ color: "var(--color-ink-400)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  Show all {pending.length} pending →
                </a>
              </p>
            )}
        </div>
        )}

        {/* ── Forms ── */}
        <div id="forms" style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
              Forms
            </h2>
            <Link
              href="/admin/forms/create"
              className="text-xs font-mono tracking-widest uppercase"
              style={{ color: "var(--color-ink-400)" }}
            >
              Create new →
            </Link>
          </div>

          {forms.length === 0 ? (
            <div className="card text-center py-12">
              <div style={{ marginBottom: "0.75rem", color: "var(--color-ink-300)" }} aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
                No forms yet
              </p>
              <p className="text-xs mb-4" style={{ color: "var(--color-ink-400)", maxWidth: "320px", margin: "0 auto" }}>
                Create your first onboarding form to start collecting KYC, loan applications, or investment declarations from clients.
              </p>
              <Link href="/admin/forms/create" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", backgroundColor: "#C9A84C", color: "#0D1117", fontWeight: 500, borderRadius: "4px", textDecoration: "none", letterSpacing: "0.025em" }}>
                Create your first form →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="card"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--color-ink-900)" }}>
                      {form.name}
                    </h3>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-ink-300)" }}>
                      /{form.slug} · {form.fields?.length ?? 0} fields · {form.submission_count} submissions
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span
                      className="badge"
                      style={
                        form.is_active
                          ? { background: "var(--color-status-approved-bg)", color: "var(--color-status-approved-text)", border: "1px solid var(--color-status-approved-border)" }
                          : { background: "var(--color-ink-50)", color: "var(--color-ink-400)", border: "1px solid var(--color-ink-200)" }
                      }
                    >
                      {form.is_active ? "active" : "inactive"}
                    </span>
                    <Link
                      href={`/forms/${form.slug}`}
                      target="_blank"
                      className="text-xs"
                      style={{ color: "var(--color-ink-400)", textDecoration: "underline" }}
                    >
                      Preview
                    </Link>
                    <Link
                      href={`/admin/forms/edit?slug=${form.slug}`}
                      className="text-xs"
                      style={{ color: "var(--color-ink-700)", textDecoration: "underline" }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── All submissions ── */}
        <div id="submissions">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
                All Submissions
              </h2>
              {unread > 0 && (
                <span className="badge badge-submitted" style={{ fontSize: "0.7rem" }}>
                  {unread} unread
                </span>
              )}
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="card text-center py-12">
              <div style={{ marginBottom: "0.75rem", color: "var(--color-ink-300)" }} aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>
                No submissions yet
              </p>
              <p className="text-xs" style={{ color: "var(--color-ink-400)", maxWidth: "320px", margin: "0 auto" }}>
                Once clients submit your forms, their submissions will appear here for review and status updates.
              </p>
            </div>
          ) : (() => {
            const totalPages = Math.ceil(totalSubs / PAGE_SIZE);
            return (
            <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="card"
                  style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-mono text-sm" style={{ color: "var(--color-ink-900)" }}>
                      {sub.id.slice(0, 8)}…
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-400)" }}>
                      {sub.client_identifier ?? sub.submitted_by ?? "Anonymous"} ·{" "}
                      {new Date(sub.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Inline status changer */}
                  <select
                    value={sub.status}
                    onChange={(e) => handleStatusChange(sub.id, e.target.value, sub.status)}
                    aria-label={`Change status for submission ${sub.id.slice(0, 8)}`}
                    className="input"
                    style={{
                      width: "auto",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    <option value="submitted">submitted</option>
                    <option value="reviewed">reviewed</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>

                  <span className={`badge badge-${sub.status}`}>● {sub.status}</span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const newPage = Math.max(0, subPage - 1);
                    setSubPage(newPage);
                    fetchSubmissionsPage(newPage + 1);
                  }}
                  disabled={subPage === 0}
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", opacity: subPage === 0 ? 0.4 : 1, borderColor: "var(--color-ink-200)", color: "var(--color-ink-700)", backgroundColor: "transparent" }}
                >
                  ← Previous
                </button>
                <span className="text-xs font-mono" style={{ color: "var(--color-ink-600)" }}>
                  Page {subPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newPage = Math.min(totalPages - 1, subPage + 1);
                    setSubPage(newPage);
                    fetchSubmissionsPage(newPage + 1);
                  }}
                  disabled={subPage >= totalPages - 1}
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", opacity: subPage >= totalPages - 1 ? 0.4 : 1, borderColor: "var(--color-ink-200)", color: "var(--color-ink-700)", backgroundColor: "transparent" }}
                >
                  Next →
                </button>
              </div>
            )}
            </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
