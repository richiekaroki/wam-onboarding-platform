// frontend/src/app/auth/verify/VerifyClient.tsx
"use client";

import { verifyMagicLink } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No token provided. Please use the link from your email.");
      return;
    }

    verifyMagicLink(token)
      .then((user) => {
        router.push(user.is_staff ? "/admin" : "/forms");
      })
      .catch((err: unknown) => {
        setStatus("error");
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "This link is invalid or has expired.";
        setErrorMsg(msg);
      });
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="text-center animate-fade-up">
          <div
            className="animate-spin"
            style={{
              width: "48px", height: "48px",
              border: "3px solid var(--color-ink-200)",
              borderTopColor: "var(--color-gold)",
              borderRadius: "50%",
              margin: "0 auto 1.5rem",
            }}
          />
          <p className="text-sm" style={{ color: "var(--color-ink-600)" }}>
            Signing you in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <div className="w-full max-w-md text-center p-8 animate-fade-up">
        <div
          style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "var(--color-status-rejected-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-rejected)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", marginBottom: "0.75rem" }}>
          Link invalid
        </h2>
        <p className="text-sm" style={{ color: "var(--color-ink-600)", marginBottom: "2rem" }}>
          {errorMsg}
        </p>
        <Link href="/login" className="btn-primary" style={{ display: "inline-flex", backgroundColor: "var(--color-ink-900)", color: "var(--color-ink-inverse)" }}>
          Request a new link
        </Link>
      </div>
    </div>
  );
}

export default function VerifyClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <div className="animate-spin" style={{
            width: "48px", height: "48px",
            border: "3px solid var(--color-ink-200)",
            borderTopColor: "var(--color-gold)",
            borderRadius: "50%",
          }} />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
