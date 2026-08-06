// frontend/src/components/Navbar.tsx
"use client";

import {
  getCurrentUser,
  isAdmin,
  isAuthenticated,
  loadCurrentUser,
  logout,
} from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser().finally(() => setReady(true));
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Focus first interactive element when mobile drawer opens
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>("a, button");
      firstFocusable?.focus();
    }
  }, [mobileOpen]);

  // Restore focus to hamburger when drawer closes
  useEffect(() => {
    if (!mobileOpen && hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
  }, [mobileOpen]);

  if (!ready) return null;

  const user = getCurrentUser();
  const userIsAdmin = isAdmin();
  const authed = isAuthenticated();

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/forms", label: "Forms" },
    { href: "/admin/forms/create", label: "New Form" },
  ];
  const clientLinks = [{ href: "/forms", label: "Available Forms" }];
  const navLinks = userIsAdmin ? adminLinks : clientLinks;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav
      style={{
        background: "var(--color-surface-raised)",
        borderBottom: "1px solid var(--color-ink-100)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            color: "var(--color-ink-900)",
            textDecoration: "none",
          }}
        >
          Mr.Wam
        </Link>

        {/* Desktop nav links */}
        {authed && (
          <div
            className="hidden md:flex"
            style={{ gap: "0.25rem", alignItems: "center" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "0.375rem 1rem",
                  fontSize: "0.875rem",
                  color: isActive(link.href)
                    ? "var(--color-ink-900)"
                    : "var(--color-ink-400)",
                  fontWeight: isActive(link.href) ? 500 : 400,
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop user area */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: "1rem" }}>
          {authed && user ? (
            <>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--color-ink-400)" }}
              >
                {user.email}
              </span>
              {userIsAdmin && (
                <span
                  className="badge"
                  style={{
                    background: "var(--color-ink-50)",
                    border: "1px solid var(--color-ink-200)",
                    color: "var(--color-ink-600)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  ADMIN
                </span>
              )}
              <button
                onClick={logout}
                className="btn-secondary"
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                href="/login"
                className="btn-secondary"
                style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="btn-primary"
                style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger button */}
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
          style={{
            width: "44px",
            height: "44px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg
            style={{ width: "24px", height: "24px", color: "var(--color-ink-700)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          id="mobile-nav-drawer"
          role="dialog"
          aria-label="Mobile navigation"
          className="md:hidden"
          onKeyDown={(e) => { if (e.key === "Escape") setMobileOpen(false); }}
          style={{
            borderTop: "1px solid var(--color-ink-100)",
            background: "var(--color-surface-raised)",
            padding: "0.75rem 1.5rem 1.5rem",
          }}
        >
          {/* Mobile nav links */}
          {authed && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.875rem",
                    color: isActive(link.href)
                      ? "var(--color-ink-900)"
                      : "var(--color-ink-400)",
                    fontWeight: isActive(link.href) ? 500 : 400,
                    textDecoration: "none",
                    borderRadius: "4px",
                    background: isActive(link.href) ? "var(--color-ink-50)" : "transparent",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Mobile user area */}
          {authed && user ? (
            <div
              style={{
                paddingTop: "1rem",
                borderTop: "1px solid var(--color-ink-100)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <span
                className="font-mono text-xs"
                style={{ color: "var(--color-ink-400)" }}
              >
                {user.email}
              </span>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {userIsAdmin && (
                  <span
                    className="badge"
                    style={{
                      background: "var(--color-ink-50)",
                      border: "1px solid var(--color-ink-200)",
                      color: "var(--color-ink-600)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    ADMIN
                  </span>
                )}
                <button
                  onClick={logout}
                  className="btn-secondary"
                  style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                paddingTop: "1rem",
                borderTop: "1px solid var(--color-ink-100)",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <Link
                href="/login"
                className="btn-secondary"
                style={{ flex: 1, textAlign: "center", padding: "0.75rem", fontSize: "0.8rem" }}
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="btn-primary"
                style={{ flex: 1, textAlign: "center", padding: "0.75rem", fontSize: "0.8rem" }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
