// frontend/src/app/login/LoginClient.tsx
"use client";

import { requestMagicLink } from "@/lib/api";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"name" | "email" | "sent">("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await requestMagicLink(email, firstName, lastName);
      setCountdown(60);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, firstName, lastName, countdown, loading]);

  function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    setStep("email");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestMagicLink(email, firstName, lastName);
      setStep("sent");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email;

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

          {/* ── Step 1: Name ── */}
          {step === "name" && (
            <>
              <div className="mb-10">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "var(--color-ink-900)", color: "var(--color-gold)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-display)",
                  }}>1</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-ink-400)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                    Your Name
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", color: "var(--color-ink-900)" }}>
                  Welcome
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-600)" }}>
                  Let&apos;s start with your name so we can personalize your experience
                </p>
              </div>

              <form onSubmit={handleNameNext} className="space-y-5">
                <div>
                  <label htmlFor="first_name" className="label">First Name <span style={{ color: "var(--color-gold)" }}>*</span></label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="label">Last Name <span style={{ color: "var(--color-gold)" }}>*</span></label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="input"
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                  <Link href="/"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9CDD4", color: "#1F2937", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: "pointer", borderRadius: "4px", textDecoration: "none" }}>
                    ◄ Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!firstName || !lastName}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9A84C", color: "#C9A84C", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: !firstName || !lastName ? "not-allowed" : "pointer", borderRadius: "4px", opacity: !firstName || !lastName ? 0.4 : 1, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                    Next ▸
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 2: Email ── */}
          {step === "email" && (
            <>
              <div className="mb-10">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "var(--color-status-approved-bg)", color: "var(--color-status-approved)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>✓</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-ink-400)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                    {displayName}
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", color: "var(--color-ink-900)" }}>
                  Sign in
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--color-ink-600)" }}>
                  Enter your email and we&apos;ll send you a sign-in link
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="label">Email Address <span style={{ color: "var(--color-gold)" }}>*</span></label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johndoe@gmail.com"
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
                  <button
                    type="button"
                    onClick={() => setStep("name")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9CDD4", color: "#1F2937", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: "pointer", borderRadius: "4px" }}>
                    ◄ Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9A84C", color: "#C9A84C", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: loading || !email ? "not-allowed" : "pointer", borderRadius: "4px", opacity: loading || !email ? 0.4 : 1, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
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

          {/* ── Check your email ── */}
          {step === "sent" && (
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
              
              {/* Resend button with countdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                {countdown > 0 ? (
                  <p className="text-xs" style={{ color: "var(--color-ink-400)" }}>
                    Resend available in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.75rem 1.5rem", border: "1px solid #C9A84C", color: "#C9A84C",
                      fontSize: "0.875rem", fontWeight: 500, background: "transparent",
                      cursor: loading ? "not-allowed" : "pointer", borderRadius: "4px",
                      opacity: loading ? 0.4 : 1,
                    }}
                  >
                    {loading ? "Sending..." : "Resend link"}
                  </button>
                )}
                <button
                  onClick={() => { setStep("email"); setEmail(""); setCountdown(0); }}
                  style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", border: "1px solid #C9CDD4", color: "#1F2937", fontSize: "0.875rem", fontWeight: 500, background: "transparent", cursor: "pointer", borderRadius: "4px" }}
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
