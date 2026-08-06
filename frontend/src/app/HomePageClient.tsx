// frontend/src/app/page.tsx
"use client";

import { isAdmin, isAuthenticated, logout } from "@/lib/api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [admin, setAdmin]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setAdmin(isAdmin());
  }, []);

  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>("a, button");
      firstFocusable?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen && hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
  }, [mobileOpen]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface-dark)", color: "var(--color-ink-inverse)" }}>
      <style>{`
        .hero-enter { animation: fadeIn 0.3s ease forwards; }
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; }
        .cta-primary:hover { background: var(--color-gold-inverse-hover) !important; }
        .cta-secondary:hover { border-color: rgba(255,255,255,0.4) !important; color: white !important; }
        @media (prefers-reduced-motion: reduce) {
          .hero-enter { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-(--color-surface-dark) focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none" style={{ color: "var(--color-ink-inverse)" }}>
        Skip to main content
      </a>

      {/* ── Fixed nav ── */}
      <nav aria-label="Main navigation" style={{ position:"fixed", top:0, left:0, right:0, zIndex:50,
        background:"var(--color-surface-dark)", borderBottom:"1px solid var(--color-border-inverse)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 2.5rem", height:"4rem" }}>
          <Link href="/" style={{ fontFamily:"var(--font-display)", fontSize:"1.375rem",
            color:"var(--color-ink-inverse)", letterSpacing:"-0.01em", textDecoration:"none" }}>
            Mr.Wam
          </Link>

          <div className="hidden md:flex" style={{ alignItems:"center", gap:"0.75rem" }}>
            {authed ? (
              <>
                <Link href={admin ? "/admin" : "/forms"} className="nav-link"
                  style={{ fontSize:"0.72rem", color:"var(--color-ink-inverse-dim)",
                    letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none", transition:"color 0.2s" }}>
                  {admin ? "Dashboard" : "My Forms"}
                </Link>
                <button onClick={logout}
                  style={{ fontSize:"0.72rem", color:"var(--color-ink-inverse-dim)",
                    letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none", transition:"color 0.2s",
                    background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link"
                  style={{ fontSize:"0.72rem", color:"var(--color-ink-inverse-dim)",
                    padding:"0.5rem 1rem", border:"1px solid var(--color-border-inverse)",
                    letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none", transition:"color 0.2s, border-color 0.2s" }}>
                  Sign in
                </Link>
                <Link href="/login" className="cta-primary"
                  style={{ fontSize:"0.72rem", color:"var(--color-ink-900)", background:"var(--color-gold-inverse)",
                    padding:"0.5rem 1.25rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    textDecoration:"none", fontWeight:600, transition:"background 0.2s" }}>
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            ref={hamburgerRef}
            className="md:hidden flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
            }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            style={{ width:"44px", height:"44px", background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <svg style={{ width:"24px", height:"24px", color:"var(--color-ink-inverse)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-label="Mobile navigation"
            className="md:hidden"
            onKeyDown={(e) => { if (e.key === "Escape") setMobileOpen(false); }}
            style={{ borderTop:"1px solid var(--color-border-inverse)",
            padding:"0.75rem 2.5rem 1.5rem" }}>
            {authed ? (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                <Link href={admin ? "/admin" : "/forms"} className="nav-link"
                  style={{ fontSize:"0.8rem", color:"var(--color-ink-inverse-dim)",
                    padding:"0.75rem 1rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    textDecoration:"none", borderRadius:"4px", transition:"background 0.15s" }}>
                  {admin ? "Dashboard" : "My Forms"}
                </Link>
                <button onClick={logout}
                  style={{ fontSize:"0.8rem", color:"var(--color-ink-inverse-dim)",
                    padding:"0.75rem 1rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    textDecoration:"none", borderRadius:"4px", transition:"background 0.15s",
                    background:"none", border:"none", cursor:"pointer", width:"100%" }}>
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                <Link href="/login" className="nav-link"
                  style={{ fontSize:"0.8rem", color:"var(--color-ink-inverse-dim)",
                    padding:"0.75rem 1rem", border:"1px solid var(--color-border-inverse)",
                    letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none",
                    textAlign:"center", borderRadius:"4px", transition:"color 0.2s, border-color 0.2s" }}>
                  Sign in
                </Link>
                <Link href="/login" className="cta-primary"
                  style={{ fontSize:"0.8rem", color:"var(--color-ink-900)", background:"var(--color-gold-inverse)",
                    padding:"0.75rem 1rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    textDecoration:"none", fontWeight:600, textAlign:"center", borderRadius:"4px",
                    transition:"background 0.2s" }}>
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── Main content ── */}
      <main id="main-content">
      <section className="hero-enter" style={{ paddingTop:"9rem", paddingBottom:"6rem",
        padding:"9rem 2.5rem 6rem", maxWidth:"1200px", margin:"0 auto" }}>
        <div className="hero-grid" style={{ gap:"5rem" }}>

          {/* Left copy */}
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem",
              background:"var(--color-gold-inverse-bg)", border:"1px solid var(--color-gold-inverse-border)",
              padding:"0.375rem 1rem", marginBottom:"2rem" }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%",
                background:"var(--color-gold-inverse)", display:"inline-block" }} />
              <span style={{ fontSize:"0.65rem", color:"var(--color-gold-inverse)", letterSpacing:"0.14em", textTransform:"uppercase" }}>
                Built for financial services
              </span>
            </div>

            <h1 style={{ fontFamily:"var(--font-display)",
              fontSize:"clamp(2.75rem,5vw,4.25rem)", fontWeight:500,
              lineHeight:1.05, letterSpacing:"-0.02em", margin:"0 0 1.5rem" }}>
              Client onboarding,<br />
              <em style={{ color:"var(--color-gold-inverse)", fontStyle:"italic" }}>without the friction.</em>
            </h1>

            <p style={{ fontSize:"0.95rem", color:"var(--color-ink-inverse-muted)",
              lineHeight:1.75, maxWidth:"440px", margin:"0 0 2.5rem",
              fontFamily:"var(--font-body)" }}>
              Replace scattered PDFs, manual data entry, and endless email chains
              with dynamic forms that adapt to each client. KYC, loan applications,
              investment declarations — launched in minutes, not weeks.
            </p>

            <div style={{ display:"flex", gap:"0.875rem", flexWrap:"wrap" }}>
              <Link href={authed ? (admin ? "/admin" : "/forms") : "/login"}
                className="cta-primary"
                style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem",
                  background:"var(--color-gold-inverse)", color:"var(--color-ink-900)",
                  padding:"0.875rem 2rem", fontSize:"0.8rem", fontWeight:600,
                  letterSpacing:"0.08em", textDecoration:"none", textTransform:"uppercase",
                  transition:"background 0.2s" }}>
                Start free →
              </Link>
              <Link href="#features" className="cta-secondary"
                style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem",
                  background:"transparent", color:"var(--color-ink-inverse-muted)",
                  border:"1px solid var(--color-border-inverse)", padding:"0.875rem 2rem",
                  fontSize:"0.8rem", letterSpacing:"0.08em", textDecoration:"none",
                  textTransform:"uppercase", transition:"border-color 0.2s, color 0.2s" }}>
                See how it works
              </Link>
            </div>
          </div>

          {/* Right — trust signals */}
          <div className="hero-stat-grid">
            {[
              { value:"SOC 2",    label:"Compliant",       sub:"Audited security controls" },
              { value:"ISO 27001",label:"Certified",       sub:"Information security management" },
              { value:"256-bit",  label:"Encryption",      sub:"Data protected in transit and at rest" },
              { value:"99.9%",    label:"Uptime SLA",      sub:"Enterprise grade reliability" },
            ].map((item) => (
              <div key={item.value} className="hero-stat-item">
                <p style={{ fontFamily:"var(--font-display)",
                  fontSize:"1.75rem", color:"var(--color-gold-inverse)", margin:"0 0 0.5rem", fontWeight:500 }}>
                  {item.value}
                </p>
                <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.8)",
                  margin:"0 0 0.25rem", fontWeight:500, fontFamily:"var(--font-body)" }}>
                  {item.label}
                </p>
                <p style={{ fontSize:"0.72rem", color:"var(--color-ink-inverse-dim)", margin:0,
                  fontFamily:"var(--font-body)" }}>
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height:"1px", background:"var(--color-border-inverse)", margin:"0 2.5rem" }} />

      {/* ── How it works ── */}
      <section style={{ maxWidth:"1200px", margin:"0 auto", padding:"5rem 2.5rem" }}>
        <div style={{ marginBottom:"3rem" }}>
          <p style={{ fontSize:"0.7rem", color:"var(--color-gold-inverse)", letterSpacing:"0.14em",
            textTransform:"uppercase", marginBottom:"1rem", fontFamily:"var(--font-body)" }}>
            — How it works
          </p>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(2rem,4vw,3rem)", fontWeight:400, margin:0 }}>
            Three steps to<br />
            <em style={{ color:"var(--color-gold-inverse)" }}>digital onboarding.</em>
          </h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"2rem" }}>
          {[
            {
              num: "01",
              title: "Build your form",
              desc: "Choose from field types — text, numbers, dates, dropdowns, file uploads. Add conditional logic that adapts to each client's responses.",
            },
            {
              num: "02",
              title: "Share the link",
              desc: "Send a unique form URL to your client. No account needed on their end. They fill it out on any device — mobile, tablet, or desktop.",
            },
            {
              num: "03",
              title: "Review & act",
              desc: "Submissions land in your dashboard instantly. Track status, request revisions, or approve — all in one place with real time notifications.",
            },
          ].map((step) => (
            <div key={step.num} style={{ padding:"2rem", border:"1px solid var(--color-border-inverse)", borderRadius:"4px" }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:"2.5rem", color:"var(--color-gold-inverse)", fontWeight:500, display:"block", marginBottom:"1rem" }}>
                {step.num}
              </span>
              <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", fontWeight:400, margin:"0 0 0.75rem", color:"var(--color-ink-inverse)" }}>
                {step.title}
              </h3>
              <p style={{ fontSize:"0.85rem", color:"var(--color-ink-inverse-muted)", lineHeight:1.7, margin:0, fontFamily:"var(--font-body)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height:"1px", background:"rgba(255,255,255,0.07)", margin:"0 2.5rem" }} />

      {/* ── Stats strip ── */}
      <section style={{ maxWidth:"1200px", margin:"0 auto", padding:"3.5rem 2.5rem" }}
        className="stats-strip">
        {[
          { num:"10 min",  desc:"Average setup time" },
          { num:"75%",     desc:"Less manual data entry" },
          { num:"99.9%",   desc:"Uptime SLA" },
          { num:"24/7",    desc:"Access from anywhere" },
        ].map((s) => (
          <div key={s.num} style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-display)",
              fontSize:"2.5rem", color:"var(--color-ink-inverse)", margin:"0 0 0.375rem", fontWeight:500 }}>
              {s.num}
            </p>
            <p style={{ fontSize:"0.75rem", color:"var(--color-ink-inverse-dim)",
              textTransform:"uppercase", letterSpacing:"0.1em", margin:0,
              fontFamily:"var(--font-body)" }}>
              {s.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Divider ── */}
      <div style={{ height:"1px", background:"rgba(255,255,255,0.07)", margin:"0 2.5rem" }} />

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth:"1200px", margin:"0 auto", padding:"5rem 2.5rem" }}>
        <div style={{ marginBottom:"3rem" }}>
          <p style={{ fontSize:"0.7rem", color:"var(--color-gold-inverse)", letterSpacing:"0.14em",
            textTransform:"uppercase", marginBottom:"1rem", fontFamily:"var(--font-body)" }}>
            — What you get
          </p>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(2rem,4vw,3rem)", fontWeight:400, margin:0 }}>
            Everything you need,<br />
            <em style={{ color:"var(--color-gold-inverse)" }}>nothing you don&apos;t.</em>
          </h2>
        </div>

        <div className="feature-grid">
          {[
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
              title:"Dynamic Fields",
              desc:"Text, numbers, dates, dropdowns, checkboxes, file uploads — mix any combination. Update forms anytime without breaking existing submissions.",
              tags:["text","number","date","file","dropdown"],
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6m-6-9H3m18 0h-3m-1.5-6.5L15 7m-6 10l-1.5 1.5m11-1.5L15 17M7 7L5.5 5.5"/></svg>,
              title:"Conditional Logic",
              desc:"Show or hide fields based on previous answers. Require income proof only when loan amounts exceed a threshold. Each client sees a tailored form.",
              tags:["conditional","per field","validated"],
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              title:"Bank Grade Security",
              desc:"256-bit encryption, SOC 2 compliance, ISO 27001 certified. Your clients' sensitive data is protected at every step — in transit and at rest.",
              tags:["encrypted","SOC 2","ISO 27001"],
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
              title:"Instant Notifications",
              desc:"Staff are notified the moment a form is submitted. Email alerts and in app notifications keep your team in the loop — no more checking manually.",
              tags:["email","in app","real time"],
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
              title:"Submission Tracking",
              desc:"Track every submission from received to approved. Filter by status, date, or form type. Export data for compliance reporting and audits.",
              tags:["status","export","audit"],
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
              title:"Multi Device Ready",
              desc:"Clients fill out forms on any device — phone, tablet, or desktop. Responsive design ensures a seamless experience everywhere.",
              tags:["mobile","tablet","desktop"],
            },
          ].map((f) => (
            <div key={f.title} className="feature-grid-item">
              <div aria-hidden="true" style={{ color:"var(--color-gold-inverse)", margin:"0 0 1.25rem" }}>{f.icon}</div>
              <h3 style={{ fontFamily:"var(--font-display)",
                fontSize:"1.375rem", fontWeight:400, margin:"0 0 0.875rem", color:"var(--color-ink-inverse)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize:"0.85rem", color:"var(--color-ink-inverse-muted)",
                lineHeight:1.7, margin:"0 0 1.5rem", fontFamily:"var(--font-body)" }}>
                {f.desc}
              </p>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                {f.tags.map((t) => (
                  <span key={t} style={{ fontSize:"0.65rem", color:"rgba(201,168,76,0.7)",
                    border:"1px solid var(--color-gold-inverse-border)", padding:"0.2rem 0.6rem",
                    fontFamily:"var(--font-mono)", letterSpacing:"0.05em" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section style={{ maxWidth:"1200px", margin:"0 auto", padding:"5rem 2.5rem", textAlign:"center" }}>
        <p style={{ fontSize:"0.7rem", color:"var(--color-gold-inverse)", letterSpacing:"0.14em",
          textTransform:"uppercase", marginBottom:"2rem", fontFamily:"var(--font-body)" }}>
          — Trusted by teams who move fast
        </p>
        <blockquote style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,3vw,2.25rem)",
          fontWeight:400, fontStyle:"italic", color:"var(--color-ink-inverse)", lineHeight:1.4,
          maxWidth:"700px", margin:"0 auto 1.5rem" }}>
          &ldquo;We cut our client onboarding from 3 days to 20 minutes. The conditional logic alone saved us hours of back-and-forth.&rdquo;
        </blockquote>
        <p style={{ fontSize:"0.8rem", color:"var(--color-ink-inverse-dim)", fontFamily:"var(--font-body)" }}>
          Operations Director, East African Investment Firm
        </p>
      </section>

      {/* ── CTA band ── */}
      <section style={{ background:"var(--color-gold-inverse)", padding:"5rem 2.5rem", textAlign:"center" }}>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(2rem,4vw,3rem)", fontWeight:400, color:"var(--color-surface-dark)",
          margin:"0 0 1rem", lineHeight:1.15 }}>
          Stop losing clients to<br />clunky onboarding.
        </h2>
        <p style={{ fontSize:"0.95rem", color:"rgba(10,10,10,0.7)",
          maxWidth:"500px", margin:"0 auto 2.5rem", lineHeight:1.7,
          fontFamily:"var(--font-body)" }}>
          Set up your first form in under 10 minutes. No credit card required.
          See why financial institutions choose Mr.Wam.
        </p>
        <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/login"
            className="cta-primary"
            style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem",
              background:"var(--color-surface-dark)", color:"var(--color-ink-inverse)",
              padding:"1rem 2.5rem", fontSize:"0.8rem", fontWeight:600,
              letterSpacing:"0.08em", textDecoration:"none", textTransform:"uppercase",
              borderRadius:"4px", transition:"background 0.2s" }}>
            Get started free →
          </Link>
        </div>
        <p style={{ fontSize:"0.72rem", color:"rgba(10,10,10,0.6)",
          marginTop:"1.5rem", fontFamily:"var(--font-body)" }}>
          SOC 2 compliant · Enterprise-grade security · No credit card needed
        </p>
      </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop:"1px solid var(--color-border-inverse)", padding:"2rem 2.5rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        maxWidth:"1200px", margin:"0 auto" }}>
        <span style={{ fontFamily:"var(--font-display)",
          fontSize:"1.125rem", color:"var(--color-ink-inverse-dim)" }}>
          Mr.Wam
        </span>
        <span style={{ fontSize:"0.7rem", color:"var(--color-ink-inverse-dim)",
          letterSpacing:"0.08em", fontFamily:"var(--font-body)" }}>
          © {new Date().getFullYear()} Mr.Wam Ltd
        </span>
      </footer>
    </div>
  );
}
