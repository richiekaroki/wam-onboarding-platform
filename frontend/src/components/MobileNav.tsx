// frontend/src/components/MobileNav.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

interface MobileNavProps {
  items: NavItem[];
  onLogout?: () => void;
  userInitials?: string;
  userName?: string;
}

export default function MobileNav({ items, onLogout, userInitials, userName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-ink-700)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 40,
            }}
          />
          <nav
            role="navigation"
            aria-label="Mobile navigation"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "280px",
              height: "100vh",
              background: "var(--color-surface-raised)",
              boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
              zIndex: 50,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              animation: "slideInRight 0.2s ease",
            }}
          >
            {/* Close button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)" }}>
                Mr.Wam
              </span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-ink-400)",
                  padding: "0.25rem",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  padding: "0.75rem 1rem",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: item.active ? 600 : 400,
                  color: item.active ? "var(--color-ink-900)" : "var(--color-ink-600)",
                  background: item.active ? "var(--color-ink-50)" : "transparent",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* User info + logout */}
            <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--color-ink-100)" }}>
              {userInitials && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "var(--color-ink-900)", color: "var(--color-gold)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    {userInitials}
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-ink-700)" }}>
                    {userName}
                  </span>
                </div>
              )}
              {onLogout && (
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "none",
                    border: "1px solid var(--color-ink-200)",
                    borderRadius: "4px",
                    color: "var(--color-ink-600)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          </nav>
        </>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
