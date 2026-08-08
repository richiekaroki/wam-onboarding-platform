// frontend/src/app/profile/ProfileClient.tsx
"use client";

import { getCurrentUser, loadCurrentUser, updateProfile, logout } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getInitials(first: string, last: string, email: string): string {
  if (first || last) return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase();
  return email?.[0]?.toUpperCase() || "?";
}

function getDisplayName(first: string, last: string, email: string): string {
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return email;
}

export default function ProfileClient() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser().then((user) => {
      if (!user) { router.push("/login"); return; }
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email);
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="animate-spin" style={{
          width: "40px", height: "40px",
          border: "3px solid var(--color-ink-200)",
          borderTopColor: "var(--color-gold)",
          borderRadius: "50%",
        }} />
      </div>
    );
  }

  const initials = getInitials(firstName, lastName, email);
  const displayName = getDisplayName(firstName, lastName, email);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-surface)" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-900)" }}>
        Skip to main content
      </a>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "var(--color-ink-900)" }}
      >
        <div className="relative">
          <Link
            href="/"
            className="text-xs font-mono tracking-widest uppercase mb-12"
            style={{ color: "var(--color-gold)", textDecoration: "none", display: "block" }}
          >
            Mr.Wam
          </Link>
          <h1
            className="text-5xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "white" }}
          >
            Your<br />Profile
          </h1>
          <p className="mt-6 text-sm leading-relaxed max-w-sm" style={{ color: "var(--color-ink-300)" }}>
            Keep your account details up to date so your team can identify you across submissions and notifications.
          </p>
        </div>

        <div className="relative flex gap-8 text-xs font-mono" style={{ color: "var(--color-ink-400)" }}>
          <span>SOC 2 Compliant</span>
          <span>256-bit Encryption</span>
          <span>ISO 27001</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <main className="flex-1 flex items-center justify-center p-8" id="main-content">
        <div className="w-full max-w-md animate-fade-up">

          {/* Avatar + greeting */}
          <div className="text-center mb-10">
            <div
              style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "var(--color-ink-900)", color: "var(--color-gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600,
              }}
            >
              {initials}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)", marginBottom: "0.25rem" }}>
              {displayName}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-ink-400)" }}>
              {email}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: "2rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="first_name" className="label">First Name</label>
                <input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="input"
                />
              </div>

              <div style={{ marginBottom: "1.75rem" }}>
                <label htmlFor="last_name" className="label">Last Name</label>
                <input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="input"
                />
              </div>

              {error && (
                <div className="text-sm px-4 py-3 mb-4" style={{ background: "var(--color-status-rejected-bg)", border: "1px solid var(--color-status-rejected-border)", color: "var(--color-status-rejected-text)", borderRadius: "4px" }} role="alert">
                  {error}
                </div>
              )}
              {saved && (
                <div className="text-sm px-4 py-3 mb-4" style={{ background: "var(--color-status-approved-bg)", border: "1px solid var(--color-status-approved-border)", color: "var(--color-status-approved-text)", borderRadius: "4px" }}>
                  Profile updated successfully
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Link href="/forms" className="btn-secondary" style={{ padding: "0.625rem 1.25rem", fontSize: "0.8rem" }}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: "0.625rem 1.5rem", fontSize: "0.8rem", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          {/* Sign out */}
          <div className="text-center mt-6">
            <button
              onClick={logout}
              style={{
                fontSize: "0.75rem", color: "var(--color-ink-400)",
                background: "none", border: "none", cursor: "pointer",
                letterSpacing: "0.05em", textTransform: "uppercase" as const,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
