// frontend/src/app/login/page.tsx
"use client";

import { requestMagicLink } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestMagicLink(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            className="text-6xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "white" }}
          >
            Onboarding
            <br />
            <span style={{ color: "var(--color-gold)" }}>Platform</span>
          </h1>
          <p className="mt-6 text-sm leading-relaxed max-w-sm" style={{ color: "var(--color-ink-300)" }}>
            Secure, dynamic form management for financial services. KYC, loan
            applications, and investment declarations — all in one place.
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

          {sent ? (
            /* ── Check your email ── */
            <div className="text-center">
              <div
                style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "var(--color-status-approved-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-approved)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", marginBottom: "0.75rem" }}>
                Check your email
              </h2>
              <p className="text-sm" style={{ color: "var(--color-ink-600)", marginBottom: "2rem" }}>
                We sent a sign-in link to<br />
                <strong style={{ color: "var(--color-ink-900)" }}>{email}</strong>
              </p>
              <p className="text-xs" style={{ color: "var(--color-ink-400)", marginBottom: "2rem" }}>
                The link expires in 10 minutes. Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9CDD4", color: "#1F2937", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: "pointer", borderRadius: "4px" }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* ── Email input form ── */
            <>
              <div className="mb-10">
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", color: "var(--color-ink-900)" }}>
                  Sign in
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-600)" }}>
                  Enter your email and we&apos;ll send you a sign-in link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="label">Email Address <span style={{ color: "var(--color-gold)" }}>*</span></label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mrwam.com"
                    required
                    className="input"
                  />
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-400)" }}>
                    This is how we&apos;ll communicate with you.
                  </p>
                </div>

                {error && (
                  <p className="text-sm px-4 py-3 bg-red-50 border border-red-200 text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                  <Link href="/"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9CDD4", color: "#1F2937", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: "pointer", borderRadius: "4px", textDecoration: "none" }}>
                    ◄ Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9A84C", color: "#C9A84C", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: loading || !email ? "not-allowed" : "pointer", borderRadius: "4px", opacity: loading || !email ? 0.4 : 1, letterSpacing: "0.05em", textTransform: "uppercase" }}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          className="animate-spin"
                          style={{
                            width: "1rem", height: "1rem",
                            border: "2px solid #C9CDD4",
                            borderTopColor: "#C9A84C",
                            borderRadius: "50%",
                            display: "inline-block",
                          }}
                        />
                        Sending…
                      </span>
                    ) : (
                      <>Next ▸</>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
